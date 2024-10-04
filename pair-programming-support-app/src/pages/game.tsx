import { io } from "socket.io-client";
import { useEffect, useState, useRef, useCallback } from 'react';
import { DialogStatus } from "../components/modal";
import MessageDialog from '../components/modal';
import { useRouter } from "next/router";
import { MAP_COL_SIZE, MAP_ROW_SIZE, QUESTION_LEVEL_NUM, getMapID, tileImageName, questionMap, questionAgentPos, limitMoveBlocksNum } from "../components/map";

// Import Blockly core.
import * as Blockly from 'blockly/core';
// Import the default blocks.
import * as libraryBlocks from 'blockly/blocks';
// Import a generator.
import {javascriptGenerator} from 'blockly/javascript';
// Import a message file.
import * as Ja from 'blockly/msg/ja';
import toolbox from "../components/blockly-tools";

Blockly.setLocale(Ja);

const socket = io("http://localhost:8080", {path: "/socket/"});

// サーバとの通信に使うコマンド一覧
enum Command {
    Start       = "start",
    GetQuiz     = "get_quiz",
    Attack      = "attack",
};

const accessDate = getDate();
let viewSrcMap = new Array<String>(MAP_ROW_SIZE * MAP_COL_SIZE).fill("");

// 問題番号
let questionNum = 0;
// 問題の正解・不正解数をカウント
let answerStatus = [
    0, // 正解数
    0, // 不正解数
];

// 使用ブロック数をカウント
let blockCount : {[blockName:string]: number} = {
    "start": 0,
    "move" : 0,
    "flag-if-else" : 0,
    "custom-loop-times": 0,
    "goal" : 0,
};


function getDate() {
    let ymd  = new Date().toLocaleDateString('sv-SE');
    let time = new Date().toLocaleTimeString('ja-JP', {hour12:false});

    return ymd + "-" + time;
}

let workspace:any;

export default function Game() {

    const router = useRouter();

    // 初期化用の変数
    const [initFlag, _]                     = useState(false);
    // ダイアログ用変数
    const [isOpenDialog, setIsOpenDialog]   = useState(true);
    const [dialogStatus, setDialogStatus]   = useState<DialogStatus>("ready");
    // マップの表示を更新する(再レンダリング)用の変数
    const [mapUpdate, setMapUpdate]         = useState(true);
    // 問題のレベル
    const [questionLevel, setQuestionLevel] = useState(1);
    // 正解状態かを判定する変数
    const [isCorrectStatus, setIsCorrectStatus] = useState(false);
    // 得点
    const [point, setPoint] = useState(0);

    // 問題番号
    const [qnum, setQnum]                       = useState<number>(100);

    // Require Blockly core.
    const Blockly = require('blockly/core');
    // Require the default blocks.
    const libraryBlocks = require('blockly/blocks');
    // Require a generator.
    const {javascriptGenerator} =  require('blockly/javascript');
    // Require a message file.
    const En = require('blockly/msg/en');

    
    // 表示マップを動的に作成
    const tableData = Array.from({ length: MAP_ROW_SIZE }, (_, rowIndex) =>
        Array.from({ length: MAP_COL_SIZE }, (_, colIndex) => `${rowIndex * MAP_ROW_SIZE + colIndex}`)
    );

    // 画面描画開始時の処理
    useEffect(() => {
        // Passes the ID.
        workspace = Blockly.inject('blocklyDiv', {toolbox:toolbox});
        // スタートブロックが付いていないブロックの処理を実行しないようにする 
        workspace.addChangeListener(Blockly.Events.disableOrphans);

        console.log("start init");
        // クライアントと接続
        socket.on("connect", () => {
            console.log("client connected");
        });

        // 読み込み中ダイアログを表示
        popDialog("ready");
        sendMessage(Command.Start, {page: "game"});
        // 問題番号・マップを初期化
        questionNum = getQuestionNum();
        initMap(questionNum);
        resetStatus();
    }, [initFlag]);

    /**
     * initMap 表示されるマップを問題の初めの状態にリセットする関数
     * @param questionNumber 取り組む問題の番号(questionMapの番号)
     */
    function initMap(questionNumber: number) {
        // 全てのタイルに対してリセット処理を行う
        for (var i = 0; i < MAP_ROW_SIZE; i++) {
            for (var j = 0; j < MAP_COL_SIZE; j++) {
                // タイル表示を変更する関数を呼び出す
                // questionMap(問題の初期状態)の数字を渡すことで問題のリセットを実現する
                setViewTile(getMapID(i, j), questionMap[questionNumber][getMapID(i, j)]);
            }
        }
    }
    
    /**
     * setQuestionNum 新しい問題番号を設定する関数
     * @param isCorrect 問題に正解できたかどうか
     * @returns 新しい問題番号
     */
    function getQuestionNum(isCorrect?: boolean) : number {
        console.log(isCorrect);
        // 問題に正解した場合・不正解の場合の処理
        if (typeof isCorrect != "undefined") {
            console.log("totta");
            if (isCorrect) {
                // 正解の場合は正解カウンターを+1する
                answerStatus[0]++;
                console.log("tasarea");
            } else {
                // 不正解の場合は不正解カウンターを+1する
                answerStatus[1]++;
                console.log("hikareta");
            }    
        } else {
            console.log("hai");
        }

        // レベルアップ・レベルダウンの判定
        if (answerStatus[0] >= 4) {
            // 正解カウンターが4を超えている場合は、問題のレベルを1上げる
            // 最大レベルは4なので、それより値が大きくならないようにする
            setQuestionLevel((questionLevel == 4 ? 4 : questionLevel + 1));
            // 正解・不正解カウンターを0にリセットする
            answerStatus[0] = answerStatus[1] = 0;

            console.log("リセット1");
        } else if(answerStatus[1] >= 4) {
            // 不正解カウンターが4を超えている場合は、問題のレベルを1下げる
            // 最小レベルは1なので、それより値が小さくならないようにする
            setQuestionLevel((questionLevel == 1 ? 1 : questionLevel - 1));
            // 正解・不正解カウンターを0にリセットする
            answerStatus[0] = answerStatus[1] = 0;
            console.log("リセット2");
        }

        console.log(answerStatus);

        // 新しい問題番号の作成
        // (0~29の乱数) + 30 * (問題レベル - 1)
        return Math.floor(Math.random() * QUESTION_LEVEL_NUM) + QUESTION_LEVEL_NUM * (questionLevel - 1);
    }

    /**
     * setViewTile タイルの表示(img)を変更する関数
     * @param tileNum 変更するタイル(imgタグのid)の番号
     * @param tileImageNameNum どのタイルに変更するかをtileImageNumの番号で指定
     */
    function setViewTile(tileNum: number, tileImageNameNum: number) {
        // 指定されたファイルの番号でタイルのimgを更新
        viewSrcMap[tileNum] = `./images/${tileImageName[tileImageNameNum]}.png`;
        // 再レンダリングのためにアップデート変数を書き換える
        setMapUpdate(!mapUpdate);

        // MEMO: ローカルサーバで実行している場合はこのreturnを使わない
        // リモートサーバ等の場合は実行時、パスが変化する恐れがあるため以下のプログラムを利用する
        // viewSrcMap[tileNum] = new URL(`./images/${imageName[tileID]}.png`, import.meta.url).href;
    }
    
    /**
     * setViewTileByName タイルの表示(img)を変更する関数
     * @param tileName 変更するタイルの名称
     * @param tileNum どのタイルに変更するかをtileImageNumの番号で指定
     */
    function setViewTileByName(tileName: string, tileNum: number) {
        // 指定されたファイル名でタイルのimgを更新
        viewSrcMap[tileNum] = `./images/${tileName}.png`;
        // 再レンダリングのためにアップデート変数を書き換える
        setMapUpdate(!mapUpdate);
    }

    /**
     * getTileImageName 指定した問題・座標のタイルの名称を取得する関数
     * @param tileNum タイルの座標
     * @param questionNum 問題番号
     * @returns 指定された問題・座標のタイルの名称
     */
    function getTileImageName(tileNum: number, questionNum: number): string {
        // 指定された問題・座標のタイルの名称をreturnする
        return tileImageName[questionMap[questionNum][tileNum]];
    }
    
    /**
     * getQuestionAgentPos エージェントの初期座標を取得する関数
     * @param questionNum 問題番頭
     * @param agentNum エージェント番号(0か1のいずれか)
     * @returns エージェントの初期座標(0～63の範囲の番号)
     */
    function getQuestionAgentPos(questionNum: number, agentNum: number) {
        // 変数questionAgentPosより、指定された問題・エージェントの初期座標を返す
        return questionAgentPos[questionNum][agentNum];
    }

    /**
     * isAgentFinished エージェントがゴールの座標上にいるか判定を行う
     * @returns 座標上にいる場合はtrue、いない場合はfalseを返却する
     */
    function isAgentFinished(agentPos: number): boolean {
        // エージェントの座標がquestionMapでゴールを表す5にいるかどうか判定
        return questionMap[questionNum][agentPos] == 5;
    }

    /**
     * isReachOnFlag エージェントがフラグの上にたどり着いたかを判定
     * @param agentPos エージェントの座標
     * @param flagShapeNum 旗の形(三角・四角など)
     * @returns 
     */
    function isReachOnFlag(agentPos: number, flagShapeNum: number): boolean {
        return questionMap[questionNum][agentPos] != flagShapeNum;
    }

    // コマンドとデータをサーバに送信する
    function sendMessage(command: Command, data={}): void {
        // サーバへデータを送信
        socket.emit(command, data);
    }
    
    // ステータス(ダイアログメッセージ)をセットした後に表示する
    const popDialog = (status: DialogStatus) => {
        setDialogStatus(status);
        setIsOpenDialog(true);
    };

    // ステータスをnoneにリセットしてダイアログを非表示にする
    const resetStatus = () => {
        setDialogStatus("none");
        setIsOpenDialog(false);
    }

    // サーバからデータ受信を受信したときの処理
    socket.onAny((command, ...data: any) => {
        console.log("data receive ->" + command);
        data = data[0];

        switch(command) {
            // ゲーム開始の準備
            case Command.Start:
                console.log("start received");
                resetStatus();
                break;

            default:
                console.log("error occured!");
                break;
        }
    });

    // 解答ボタン押下時の処理
    const clickAnswerButton = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();

        // 正誤判定を行うための変数
        let isReach = false;

        // 使用ブロック数のカウントを0にリセット
        for (let [key, _] of Object.entries(blockCount)) {
            blockCount[key] = 0;
        }

        // ユーザが作ったブロックプログラムをjsに変換
        const code = javascriptGenerator.workspaceToCode(workspace);

        for (var block of workspace.getAllBlocks()) {
            let type: string = block.type;
            blockCount[type] = blockCount[type] + 1;
        }

        try {
            // マップの表示情報を初期化
            initMap(questionNum);
            // ユーザが組んだプログラムを実行
            eval(code);

            // 正誤判定を行う
            let isCorrect = false;
            // isReachが正(エージェントがゴールに到達している)かチェック
            if (isReach) {
                    // スタートブロックとゴールブロックが1つ使われていない場合
                    if (blockCount["start"] == 1 && blockCount["goal"] == 1) {
                        // すべての条件に当てはまっている場合は問題に正解したとする
                        isCorrect = true;

                        // 得点計算
                        let newPoint : number;
                        if (limitMoveBlocksNum[questionNum] == -1 || blockCount["move"] > limitMoveBlocksNum[questionNum] + 2) {
                            // 移動ブロックの個数に制約がない場合や、制約を超過している場合は10ポイント
                            newPoint = 10;
                        } else if (blockCount["move"] <= limitMoveBlocksNum[questionNum]) {
                            // 移動ブロックの個数が制約以内に収まっている場合は30ポイント
                            newPoint = 30;
                        } else {
                            // それ以外の場合は20ポイント
                            newPoint = 20;
                        }

                        // 攻撃コマンドを送信
                        sendMessage(Command.Attack, {point : newPoint});
                        // ポイントを加算
                        setPoint(point + newPoint);
                    }
            }

            // 問題の正誤に応じてダイアログを設定
            if (isCorrect) {
                // 問題に正解した場合
                // ダイアログ・問題の状態を正解にする
                setDialogStatus("correct");
                setIsCorrectStatus(true);

            } else {
                // 問題に不正解の場合
                // ダイアログを不正解の状態にする
                setDialogStatus("incorrect");
            }

            // ダイアログを開く
            setIsOpenDialog(true);

          } catch (error) {
            // 構文エラーが発生してプログラムが実行できなかった場合
            // 不正解の場合の同じダイアログ表示を行う
            setDialogStatus("incorrect");
            setIsOpenDialog(true);

        }
    };

    // パスボタン押下時の処理
    const clickPassButton  = (event: React.MouseEvent<HTMLButtonElement>) => {
        // 新しい問題番号を取得してマップを初期化
        questionNum = getQuestionNum(false);
        initMap(questionNum);
    }

    // 次の問題へボタン押下時の処理
    const clickNextButton = (event: React.MouseEvent<HTMLButtonElement>) => {
        // ステータスをfalseに戻す
        setIsCorrectStatus(false);
        // 問題番号を更新
        questionNum = getQuestionNum(true);
        initMap(questionNum);
    };

    const setQuestionNum = (event: React.MouseEvent<HTMLButtonElement>) => {
        questionNum = qnum;
        initMap(questionNum);
    };
    
    // 表示リセットボタン押下時の処理
    const clickResetButton = (event: React.MouseEvent<HTMLButtonElement>) => {
        initMap(questionNum);
    };

    // 画面描画
    return (
        <main className="min-h-screen h-full flex-col justify-between">
            <MessageDialog
                open={isOpenDialog}
                status={dialogStatus}
                onCancel={() => setIsOpenDialog(false)}
                onOk={() => resetStatus()}
            />

            {/* <h1 className="text-xl w-100 bg-blue-400">ペアプログラミング学習用ゲーム</h1> */}
            <div className="text-sm">問題レベル：{questionLevel}　　動くブロックの個数　{ limitMoveBlocksNum[questionNum] == -1 ? (
                "こうげき1倍"
            ) : (
                limitMoveBlocksNum[questionNum] + "こ以内ならこうげき3倍、" + (limitMoveBlocksNum[questionNum] + 1) + "~" + (limitMoveBlocksNum[questionNum] + 2) + "こ以内ならこうげき2倍、それいがいはこうげき1倍"
            )
                }</div>
            <div className="flex justify-center w-full">
                <div id="blocklyDiv" className="w-2/3 h-96"></div>
                <table id="map" className="w-1/3 h-min">
                    <tbody>
                    {tableData.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {row.map((cell, _) => (
                                <td>
                                <img id={"map-" + cell} src={viewSrcMap[Number(cell)]} />
                                </td>
                            ))}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <div className="flex">
            <form>
                <div>
                    <label>問題番号</label>
                    <input name="input-question-num" value={qnum}
                     onChange={(event) => setQnum(Number(event.target.value))}/>
                </div>
            </form>
                <button onClick={setQuestionNum} className="rounded-md bg-slate-800 py-0.5 px-2.5 border border-transparent text-center text-sm text-white transition-all shadow-sm hover:shadow focus:bg-slate-700 focus:shadow-none active:bg-slate-700 hover:bg-slate-700 active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none">番号設定</button>
            </div>
            {
                // 問題に正解していない状態の時は、問題解答に必要なボタンを表示する
                !isCorrectStatus &&
                (
                <div className="flex">
                    <button onClick={clickAnswerButton} className="rounded-md bg-slate-800 py-0.5 px-2.5 border border-transparent text-center text-sm text-white transition-all shadow-xs hover:shadow focus:bg-slate-700 focus:shadow-none active:bg-slate-700 hover:bg-slate-700 active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none mr-4 mt-1">解答</button>
                    <button onClick={clickPassButton} className="rounded-md bg-slate-800 py-0.5 px-2.5 border border-transparent text-center text-sm text-white transition-all shadow-sm hover:shadow focus:bg-slate-700 focus:shadow-none active:bg-slate-700 hover:bg-slate-700 active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none mr-4">パス</button>
                    <button onClick={clickResetButton} className="rounded-md bg-slate-800 py-0.5 px-2.5 border border-transparent text-center text-sm text-white transition-all shadow-sm hover:shadow focus:bg-slate-700 focus:shadow-none active:bg-slate-700 hover:bg-slate-700 active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none">表示をリセット</button>
                </div>
                )
            }
            
            {
                // 問題に正解後の状態の時は、次の問題に進めるボタンを表示する
                isCorrectStatus &&
                <button onClick={clickNextButton} className="rounded-md bg-slate-800 py-0.5 px-2.5 border border-transparent text-center text-sm text-white transition-all shadow-xs hover:shadow focus:bg-slate-700 focus:shadow-none active:bg-slate-700 hover:bg-slate-700 active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none mr-4 mt-1">次の問題へ</button>
            }

            <p>{point}点</p>
        </main>
    );
}
