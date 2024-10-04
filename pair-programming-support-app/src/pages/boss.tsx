import { io } from "socket.io-client";
import { useEffect, useState, useRef, useCallback } from 'react';
import { DialogStatus } from "../components/modal";
import MessageDialog from '../components/modal';
import { useRouter } from "next/router";
import useSound from "use-sound";

const socket = io("http://localhost:8080", {path: "/socket/"});

// サーバとの通信に使うコマンド一覧
enum Command {
    Start       = "start",
    Attack      = "attack",
};

enum DragonSrc {
    normal      = "./images/dragon.png",
    damege      = "./images/dragon-damage.png",
    win         = "./images/result-win.png",
    lose        = "./images/result-lose.png",
}

// 再生する音楽ファイル一覧
import damageAudio from "../../public/audio/damage.mp3";
import gameClearAudio from "../../public/audio/gameclear.mp3";
import gameOverAudio from "../../public/audio/gameover.mp3";

// 再生するオーディオ一覧
const audioTable = {
    Damage : damageAudio,
    GameClear : gameClearAudio,
    GameOver : gameOverAudio,
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
    // ドラゴンの画像を管理する
    const [dragonImage, setDragonImage]         = useState<DragonSrc>(DragonSrc.normal);
    // 制限時間・HPを管理する
    const [time, setTime]                       = useState<number>(100);
    const [HP, setHP]                           = useState<number>(100);
    // インターバルを制御する
    const timeIntervalID                        = useRef<NodeJS.Timeout | null>(null);
    const timeRef                               = useRef(time);
    // 効果音用変数
    const [playDamage] = useSound(damageAudio);
    const [playGameClear] = useSound(gameClearAudio);
    const [playGameOver] = useSound(gameOverAudio);

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
        data = data[0];

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

                // ドラゴンをダメージ時の表示にする
                setDragonImage(DragonSrc.damege);

                // ダメージを受けた時の音を鳴らす
                playDamage();

                // hpが0以下になったら勝利処理
                if (HP <= 0) {
                    // ゲームクリア時の音声を鳴らす
                    playGameClear();
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
            if (timeRef.current > 0 && HP > 0) {
                // タイムを1秒ずつ減らす
                timeRef.current -= 1;
                setTime(timeRef.current);

                // 3秒おきに、ダメージのイラストを通常状態に戻す
                if (timeRef.current % 3 == 0 && HP > 0) {
                    setDragonImage(DragonSrc.normal);
                }
            } else {
                // タイムが0になった時の処理
                // タイマーを終了
                clearInterval(timeIntervalID.current!);

                if (!(timeRef.current > 0)) {
                    // 敗北時の音声を流す
                    playGameOver();
                    // 敗北処理
                    setDragonImage(DragonSrc.lose);
                }
            }

        }, 1000);

        setTime(time - 1);
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
        <main className="min-h-screen h-full flex-col justify-between p-3">
            <MessageDialog
                open={isOpenDialog}
                status={dialogStatus}
                onCancel={() => setIsOpenDialog(false)}
                onOk={() => resetStatus()}
            />
            
            {
                !isGameRunning &&
                <form>
                <div className="my-3">
                    <label>体力</label>
                    <input name="input-hp" value={HP}
                     onChange={(event) => setHP(Number(event.target.value))}/>
                </div>
                <div className="my-3">
                    <label>タイマー(秒)</label>
                    <input name="input-time" value={time}
                     onChange={(event) => setTime(Number(event.target.value))}/>
                </div>
                <button onClick={clickStartButton} className="my-3 rounded-md bg-slate-800 py-0.5 px-2.5 border border-transparent text-center text-sm text-white transition-all shadow-sm hover:shadow focus:bg-slate-700 focus:shadow-none active:bg-slate-700 hover:bg-slate-700 active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none">ゲームスタート</button>
            </form>
            }
            {
                isGameRunning &&
                <div className="text-align">
                    <p className="text-xl">残り{time}秒</p>
                    <p className="text-xl">残りの体力：{HP}</p>
                    <button onClick={clickStopButton} className="rounded-md bg-slate-800 py-0.5 px-2.5 border border-transparent text-center text-sm text-white transition-all shadow-sm hover:shadow focus:bg-slate-700 focus:shadow-none active:bg-slate-700 hover:bg-slate-700 active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none">ゲームストップ</button>
                    <img src={dragonImage} className="h-96"></img>
                </div>
            }            

        </main>
    );
}
