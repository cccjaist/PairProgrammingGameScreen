import { io } from "socket.io-client";
import { useEffect, useState, useRef, useCallback } from 'react';
import { DialogStatus } from "../components/modal";
import MessageDialog from '../components/modal';
import { useRouter } from "next/router";
import { mapColSize, mapRowSize, getMapID, tileImageName, questionMap } from "../components/map";

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

// studentIDを取得
let studentID = "";

const accessDate = getDate();

let viewSrcMap = new Array<String>(mapRowSize * mapColSize).fill("");

// 問題番号
let questionNum = 0;
// 主人公の座標
let agentPos = 9;
// 使用ブロック数をカウント
let blockCount = {
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
    const [initFlag, setInitFlag]           = useState(false);
    // ダイアログ用変数
    const [isOpenDialog, setIsOpenDialog]   = useState(true);
    const [dialogStatus, setDialogStatus]   = useState<DialogStatus>("ready");
    // マップの表示を更新する(サイレンダリング)用の変数
    const [mapUpdate, setMapUpdate]         = useState(true);

    // Require Blockly core.
    const Blockly = require('blockly/core');
    // Require the default blocks.
    const libraryBlocks = require('blockly/blocks');
    // Require a generator.
    const {javascriptGenerator} =  require('blockly/javascript');
    // Require a message file.
    const En = require('blockly/msg/en');

    
    // 表示マップを動的に作成
    const tableData = Array.from({ length: mapRowSize }, (_, rowIndex) =>
        Array.from({ length: mapColSize }, (_, colIndex) => `${rowIndex * mapRowSize + colIndex}`)
    );

    // 画面描画開始時の処理
    useEffect(() => {
        studentID = localStorage.getItem("student-id") ?? "";
        // studentIDがnull(ログイン情報がない)場合はサインイン画面へ遷移
        if (!studentID) {
            router.push("/signin");
        }

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

        // マップを初期化
        // TODO: どの問題(番号)に初期化するかは後で決定
        initMap(questionNum);
    }, [initFlag]);

    /**
     * initMap 表示されるマップを問題の初めの状態にリセットする関数
     * @param questionNumber 取り組む問題の番号(questionMapの番号)
     */
    function initMap(questionNumber: number) {
        // 全てのタイルに対してリセット処理を行う
        for (var i = 0; i < mapRowSize; i++) {
            for (var j = 0; j < mapColSize; j++) {
                // タイル表示を変更する関数を呼び出す
                // questionMap(問題の初期状態)の数字を渡すことで問題のリセットを実現する
                setViewTile(getMapID(i, j), questionMap[questionNumber][getMapID(i, j)]);
            }
        }
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
     */
    function getTileImageName(tileNum: number, questionNum: number): string {
        // 指定された問題・座標のタイルの名称をreturnする
        return tileImageName[questionMap[questionNum][tileNum]];
    }

    /**
     * isAgentFinished エージェントがゴールの座標上にいるか判定を行う
     * @returns 座標上にいる場合はtrue、いない場合はfalseを返却する
     */
    function isAgentFinished() {
        // エージェントの座標がquestionMapでゴールを表す5にいるかどうか判定
        return questionMap[questionNum][agentPos] == 5;
    }

    // コマンドとデータをサーバに送信する
    function sendMessage(command: string, data={}): void {
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
            
            // 解答が当たっていたかどうかの判定
            case Command.JudgeAns:
                
                if (data["judge"]) {
                    // 正解の場合
                    popDialog("correct");
                } else {
                    // 不正解の場合
                    popDialog("incorrect");
                }
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
        let isCorrect = false;

        // 使用ブロック数のカウントを0にリセット
        for (let [key, _] of Object.entries(blockCount)) {
            blockCount[key] = 0;
        }

        // const codebox = document.getElementById("codebox");

        // コードの最後にプログラムを占める文を付け足す
        // スタートブロックとlastCodeが揃うことでexecute関数が作動する
        const lastCode = `
            }
            execute();
            `;

        // ユーザが作ったブロックプログラムをjsに変換
        const code = javascriptGenerator.workspaceToCode(workspace) + lastCode;

        for (var block of workspace.getAllBlocks()) {
            let type: string = block.type;
            blockCount[type] = blockCount[type] + 1;
        }
        console.log(blockCount);

        try {
            eval(code);

            // isCorrectにより正誤結果をチェック
            if (isCorrect) {
                // 問題に正解した場合
                setDialogStatus("correct");
                sendMessage(Command.Attack, {"point": 2});
            } else {
                // 問題に不正解の場合
                setDialogStatus("incorrect");
            }
            setIsOpenDialog(true);

          } catch (error) {
            // 構文エラーが発生するのはスタートブロックがない状況
            // スタートブロックがないエラーを出す
            alert("スタートブロックが付いていません！")
        }

        // sendMessage(Command.JudgeAns);
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

            <h1 className="text-xl w-100 bg-blue-400">ペアプログラミング学習用ゲーム</h1>
            <div>スコア表示欄</div>

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

            <button onClick={clickAnswerButton}>解答</button>
            <button>パス</button>

        </main>
    );
}
