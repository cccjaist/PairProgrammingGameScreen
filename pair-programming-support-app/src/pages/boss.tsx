import { io } from "socket.io-client";
import { useEffect, useState, useRef, useCallback } from 'react';
import { DialogStatus } from "../components/modal";
import MessageDialog from '../components/modal';
import { useRouter } from "next/router";

const socket = io("http://localhost:8080", {path: "/socket/"});
// クラスIDとペアID
// TODO: ここ後で前の画面(DB？)から任意のアカウント情報を取ってこれるようにする
const classID   = 1;
const pairID    = 2;

// サーバとの通信に使うコマンド一覧
enum Command {
    Start       = "start",
    Attack      = "attack",
};

enum DragonSrc {
    normal      = "./images/dragon.png",
    damege      = "./images/dragom-damage.png",
    win         = "./images/result-win.png",
    lose        = "./images/result-lose.png",
}

export default function Game() {

    const router = useRouter();

    // 初期化用の変数
    const [initFlag, setInitFlag]               = useState(false);
    // ダイアログ用変数
    const [isOpenDialog, setIsOpenDialog]       = useState(true);
    const [dialogStatus, setDialogStatus]       = useState<DialogStatus>("ready");
    // ゲーム実行・スタンバイを管理する
    const [isGameRunning, setIsGameRunning]     = useState(false);

    const [dragonImage, setDragonImage]         = useState<DragonSrc>(DragonSrc.normal);

    const [time, setTime]                       = useState<number>(100);
    const [HP, setHP]                           = useState<number>(100);

    const timeIntervalID                        = useRef<NodeJS.Timeout | null>(null);
    const timeRef                               = useRef(time);

    // 画面描画開始時の処理
    useEffect(() => {
        console.log("start init");
        // クライアントと接続
        socket.on("connect", () => {
            console.log("client connected");
        });

        // 読み込み中ダイアログを表示
        popDialog("ready");
        sendMessage(Command.Start, {page: "boss"});

        // マップを初期化
    }, [initFlag]);

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
        console.log("hoyo");
        console.log(data);
        data = data[0];
        console.log(data);

        switch(command) {
            // ゲーム開始の準備
            case Command.Start:
                console.log("start received");
                resetStatus();
                break;
            
            // 攻撃が送られてきたら受ける
            case Command.Attack:
                // 与えられた攻撃分hpを減らす
                let point = data["data"]["point"];
                setHP(HP - point);

                // hpが0以下になったら勝利処理を行う
                if (HP <= 0) {
                    setDragonImage(DragonSrc.win);
                }
                break;

            default:
                console.log("error occured!");
                break;
        }
    });

    function startTimer() {
        timeRef.current = time;
        // カウントダウンをスタート
        timeIntervalID.current = setInterval(() => {
            if (timeRef.current > 0) {
                timeRef.current -= 1;
                setTime(timeRef.current);
            } else {
                // タイムが0になった時の処理
                // タイマーを終了
                clearInterval(timeIntervalID.current!);
                // 敗北処理
                setDragonImage(DragonSrc.lose);
            }
        }, 1000);

        setTime(time - 1);
        console.log(time);
    }

    // ゲーム開始ボタン押下時の処理
    const clickStartButton = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        setIsGameRunning(true);
        startTimer();
    };

    // ゲーム終了ボタン押下時の処理
    const clickStopButton = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        setIsGameRunning(false);
        setDragonImage(DragonSrc.normal);
        // タイムが0になったらタイマーを終了
        clearInterval(timeIntervalID.current!);
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

            <h1 className="text-xl w-100 bg-blue-400">ボス</h1>
            
            {
                !isGameRunning &&
                <form>
                <p>ゲーム設定</p>
                <div>
                    <label>体力</label>
                    <input type="number" name="input-hp" value={HP}
                     onChange={(event) => setHP(Number(event.target.value))}/>
                </div>
                <div>
                    <label>タイマー(秒)</label>
                    <input type="number" name="input-time" value={time}
                     onChange={(event) => setTime(Number(event.target.value))}/>
                </div>
                <button onClick={clickStartButton}>ゲームスタート</button>
            </form>
            }
            {
                isGameRunning &&
                <div>
                    <p>{time}</p>
                    <p>残りの体力：{HP}</p>
                    <button onClick={clickStopButton}>ゲームストップ</button>
                    <img src={dragonImage} className="h-96"></img>
                </div>
            }            

        </main>
    );
}
