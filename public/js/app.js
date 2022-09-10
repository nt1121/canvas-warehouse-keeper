const stage = [
    [1,1,2,1,0,0,0],
    [1,0,1,1,1,3,1],
    [1,3,1,1,0,0,1],
    [1,0,2,5,1,1,1],
    [1,0,0,3,0,1,0],
    [2,1,1,3,1,1,0],
    [0,0,1,1,0,2,0]
  ];
let stageState = JSON.parse(JSON.stringify(stage)); // ステージの状態
const stageHeight = stageState.length; // ステージの高さ
const stageWidth = stageState[0].length; // ステージの幅
const canvas = document.getElementById('canvas');
canvas.width = 320;
canvas.height = 480;
const ctx = canvas.getContext('2d');
const POS_STATE_WALL = 0; // 移動不可の床
const POS_STATE_FLOOR = 1; // 普通の床
const POS_STATE_DESTINATION = 2; // 目的地
const POS_STATE_BOX_ON_FLOOR = 3; // 普通の床の上に箱
const POS_STATE_BOX_ON_DESTINATION = 4; // 目的地の上に箱
const POS_STATE_PLAYER_ON_FLOOR = 5; // 普通の床の上にプレイヤー
const POS_STATE_PLAYER_ON_DESTINATION = 6; // 目的地の上にプレイヤー
const DIRECTION_UP = 1;
const DIRECTION_RIGHT = 2;
const DIRECTION_DOWN = 3;
const DIRECTION_LEFT = 4;
const arrowUpButton =     {x: 200, y: 324, w: 48, h: 48, src: 'img/arrow_up.png'};
const arrowRightButton =  {x: 252, y: 376, w: 48, h: 48, src: 'img/arrow_right.png'};
const arrowDownButton =   {x: 200, y: 428, w: 48, h: 48, src: 'img/arrow_down.png'};
const arrowLeftButton =   {x: 148, y: 376, w: 48, h: 48, src: 'img/arrow_left.png'};
const resetButton =       {x: 20, y: 376, w: 96, h: 48, src: 'img/reset_button.png'};
let isFinished = false; // ゲームをクリアしたかどうか
let step = 0; // 0は右手が前、1は左手が前
let playerDirection = DIRECTION_DOWN; // プレイヤーが向いている方向
let currentPlayerPosY = 3; // 現在のプレイヤーの位置y（0からの配列の添え字）
let currentPlayerPosX = 3; // 現在のプレイヤーの位置x（0からの配列の添え字）

// ステージの現在の状態を描画する
function displayStageState()
{
    for (let y = 0; y < stageHeight; y++) {
        for (let x = 0; x < stageWidth; x++) {
            const state = stageState[y][x];
            let src = 'img/tile' + state;
            if (state === POS_STATE_PLAYER_ON_FLOOR || state === POS_STATE_PLAYER_ON_DESTINATION) {
                src += playerDirection + String(step);
            }
            src += '.png';
            draw(src, 48 + x * 32, 48 + y * 32, 32, 32);
        }
    }
}

// プレイヤーまたは箱が指定の座標に移動できるかどうか判定する
function canMove(nextPosY, nextPosX)
{
    if (nextPosY < 0 || nextPosX < 0 || nextPosY >= stageHeight || nextPosX >= stageWidth) {
        return false;
    }
    const nextPosState = stageState[nextPosY][nextPosX];
    // 移動先が普通の床でもなく目的地でもない場合は移動不可
    if (nextPosState !== POS_STATE_FLOOR && nextPosState !== POS_STATE_DESTINATION) {
        return false;
    }
    return true;
}

// プレイヤーを移動する
function movePlayer(nextPosY, nextPosX, direction)
{
    const nextPosState = stageState[nextPosY][nextPosX];
    if (nextPosState === POS_STATE_FLOOR) {
        // 移動先が普通の床の場合は、移動先を普通の床の上にプレイヤーの状態にする
        stageState[nextPosY][nextPosX] = POS_STATE_PLAYER_ON_FLOOR;
    } else if (nextPosState === POS_STATE_DESTINATION) {
        // 移動先が目的地の場合は、移動先を目的地の上にプレイヤーの状態にする
        stageState[nextPosY][nextPosX] = POS_STATE_PLAYER_ON_DESTINATION;
    }
    const currentPosState = stageState[currentPlayerPosY][currentPlayerPosX];
    if (currentPosState === POS_STATE_PLAYER_ON_FLOOR) {
        // 移動元が普通の床の上にプレイヤーの場合は、移動元を普通の床の状態にする
        stageState[currentPlayerPosY][currentPlayerPosX] = POS_STATE_FLOOR;
    } else if (currentPosState === POS_STATE_PLAYER_ON_DESTINATION) {
        // 移動元が目的地の上にプレイヤーの場合は、移動元を目的地の状態にする
        stageState[currentPlayerPosY][currentPlayerPosX] = POS_STATE_DESTINATION;
    }
    // 現在のプレイヤーの位置を更新
    currentPlayerPosY = nextPosY;
    currentPlayerPosX = nextPosX;
    // 手の前後を反転させる
    step = step ? 0 : 1;
    // プレイヤーの向いている方向を更新
    playerDirection = direction;
}

// 箱を指定方向に移動できるか判定する
function canPush(nextPlayerPosY, nextPlayerPosX, direction)
{
    if (nextPlayerPosY < 0 || nextPlayerPosX < 0 || nextPlayerPosY >= stageHeight || nextPlayerPosX >= stageWidth) {
        return false;
    }
    const nextPlayerPosState = stageState[nextPlayerPosY][nextPlayerPosX];
    // プレイヤーの移動先が箱ではない場合は何もしない
    if (nextPlayerPosState !== POS_STATE_BOX_ON_FLOOR && nextPlayerPosState !== POS_STATE_BOX_ON_DESTINATION) {
        return false;
    }
    let nextBoxPosY = nextPlayerPosY;
    let nextBoxPosX = nextPlayerPosX;
    if (direction === DIRECTION_UP) {
        nextBoxPosY--;
    } else if (direction === DIRECTION_RIGHT) {
        nextBoxPosX++;
    } else if (direction === DIRECTION_DOWN) {
        nextBoxPosY++;
    } else if (direction === DIRECTION_LEFT) {
        nextBoxPosX--;
    }
    if (!canMove(nextBoxPosY, nextBoxPosX)) {
        return false;
    }
    return true;
}

// 箱を指定方向に移動する
function moveBox(currentBoxPosY, currentBoxPosX, direction)
{
    let nextBoxPosY = currentBoxPosY;
    let nextBoxPosX = currentBoxPosX;
    if (direction === DIRECTION_UP) {
        nextBoxPosY--;
    } else if (direction === DIRECTION_RIGHT) {
        nextBoxPosX++;
    } else if (direction === DIRECTION_DOWN) {
        nextBoxPosY++;
    } else if (direction === DIRECTION_LEFT) {
        nextBoxPosX--;
    }
    const nextPosState = stageState[nextBoxPosY][nextBoxPosX];
    if (nextPosState === POS_STATE_FLOOR) {
        // 移動先が普通の床の場合は、移動先を普通の床の上に箱の状態にする
        stageState[nextBoxPosY][nextBoxPosX] = POS_STATE_BOX_ON_FLOOR;
    } else if (nextPosState === POS_STATE_DESTINATION) {
        // 移動先が目的地の場合は、移動先を目的地の上に箱の状態にする
        stageState[nextBoxPosY][nextBoxPosX] = POS_STATE_BOX_ON_DESTINATION;
    }
    const currentPosState = stageState[currentBoxPosY][currentBoxPosX];
    if (currentPosState === POS_STATE_BOX_ON_FLOOR) {
        // 移動元が普通の床の上に箱の場合は、移動元を普通の床の状態にする
        stageState[currentBoxPosY][currentBoxPosX] = POS_STATE_FLOOR;
    } else if (currentPosState === POS_STATE_BOX_ON_DESTINATION) {
        // 移動元が目的地の上に箱の場合は、移動元を目的地の状態にする
        stageState[currentBoxPosY][currentBoxPosX] = POS_STATE_DESTINATION;
    }
}

// すべての目的地の上に箱が乗っているか判定する
function checkIfIsFinished()
{
    for (const element of stageState) {
        for (const state of element) {
        // 箱のない目的地または目的地の上にプレイヤーがいれば未クリアと判定
        if (state === POS_STATE_DESTINATION || state === POS_STATE_PLAYER_ON_DESTINATION) {
            return false;
        }
        }
    }
    isFinished = true;
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 320, 320, 160);
    ctx.font = '48px sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('CLEAR!', 70, 406);
    return true;
}

// 矢印ボタンがクリックされた時のイベント
function arrowButtonClickEvent(moveDirection) {
    if (isFinished) {
        return false;
    }
    let nextPlayerPosY = currentPlayerPosY;
    let nextPlayerPosX = currentPlayerPosX;
    if (moveDirection === DIRECTION_UP) {
        nextPlayerPosY--;
    } else if (moveDirection === DIRECTION_RIGHT) {
        nextPlayerPosX++;
    } else if (moveDirection === DIRECTION_DOWN) {
        nextPlayerPosY++;
    } else if (moveDirection === DIRECTION_LEFT) {
        nextPlayerPosX--;
    }
    if (canMove(nextPlayerPosY, nextPlayerPosX)) {
        // プレイヤーが移動できる場合はプレイヤーを移動させる
        movePlayer(nextPlayerPosY, nextPlayerPosX, moveDirection);
        // 画面の再描画
        displayStageState();
        // クリア判定
        checkIfIsFinished();
    } else if (canPush(nextPlayerPosY, nextPlayerPosX, moveDirection)) {
        // 箱を押せる場合は箱とプレイヤーを移動させる
        moveBox(nextPlayerPosY, nextPlayerPosX, moveDirection);
        movePlayer(nextPlayerPosY, nextPlayerPosX, moveDirection);
        // 画面の再描画
        displayStageState();
        // クリア判定
        checkIfIsFinished();
    }
}

// 画像を指定座標に表示する
function draw(imagePath, posX, posY, width, height)
{
    const image = new Image();
    image.src = imagePath;
    image.onload = () => {
        ctx.drawImage(image, posX, posY, width, height);
    };
}

// クリックしたときのイベント
canvas.addEventListener("click", e => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    let direction = null;
    if (x >= arrowUpButton.x && x < arrowUpButton.x + arrowUpButton.w && y >= arrowUpButton.y && y < arrowUpButton.y + arrowUpButton.h) {
        // 上矢印ボタンを押したとき
        direction = DIRECTION_UP;
    } else if (x >= arrowRightButton.x && x < arrowRightButton.x + arrowRightButton.w && y >= arrowRightButton.y && y < arrowRightButton.y + arrowRightButton.h) {
        // 右矢印ボタンを押したとき
        direction = DIRECTION_RIGHT;
    } else if (x >= arrowDownButton.x && x < arrowDownButton.x + arrowDownButton.w && y >= arrowDownButton.y && y < arrowDownButton.y + arrowDownButton.h) {
        // 下矢印ボタンを押したとき
        direction = DIRECTION_DOWN;
    } else if (x >= arrowLeftButton.x && x < arrowLeftButton.x + arrowLeftButton.w && y >= arrowLeftButton.y && y < arrowLeftButton.y + arrowLeftButton.h) {
        // 左矢印ボタンを押したとき
        direction = DIRECTION_LEFT;
    }
    if (direction) {
        // 矢印ボタンのどれかが押されたときはイベントを実行する
        arrowButtonClickEvent(direction);
    } else if (x >= resetButton.x && x < resetButton.x + resetButton.w && y >= resetButton.y && y < resetButton.y + resetButton.h) {
        // リセットボタンを押したとき
        if (confirm('最初からやり直しますか？')) {
            // 初期状態に戻してステージを再描画する
            stageState = JSON.parse(JSON.stringify(stage));
            step = 0;
            playerDirection = DIRECTION_DOWN;
            currentPlayerPosY = 3;
            currentPlayerPosX = 3;
            displayStageState();
        }
    }
});

ctx.fillStyle = 'black';
ctx.fillRect(0, 0, 320, 480);
draw(arrowUpButton.src, arrowUpButton.x, arrowUpButton.y, arrowUpButton.w, arrowUpButton.h);
draw(arrowRightButton.src, arrowRightButton.x, arrowRightButton.y, arrowRightButton.w, arrowRightButton.h);
draw(arrowDownButton.src, arrowDownButton.x, arrowDownButton.y, arrowDownButton.w, arrowDownButton.h);
draw(arrowLeftButton.src, arrowLeftButton.x, arrowLeftButton.y, arrowLeftButton.w, arrowLeftButton.h);
draw(resetButton.src, resetButton.x, resetButton.y, resetButton.w, resetButton.h);
displayStageState();
