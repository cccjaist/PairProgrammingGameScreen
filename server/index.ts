import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express()
const httpServer = createServer(app);
const io = new Server(httpServer, {
    path: "/socket/",
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

let bossSocketID = "";

// クライアントとの通信に使うコマンド一覧
enum Command {
    Start       = "start",
    GetQuiz     = "get_quiz",
    Attack      = "attack",
}

io.on("connection", (socket) => {
    console.log("connected");

    // ゲームの開始準備
    socket.on(Command.Start, (data) => {
        try {
            // ボスのページだった場合はソケットIDを記録
            let page = data["page"];
            if(page == "boss") {
                console.log("boss");
                bossSocketID = socket.id;
            }

            sendData(socket.id, Command.Start, true, data);
        } catch (error) {
            // エラーだった場合はエラー文をクライアントに返す
            console.log(error);
            if (error instanceof Error) {
                sendData(socket.id, Command.Start, false, error.message);
            }
        }
    });

    // ボスのページへ攻撃を送る
    socket.on(Command.Attack, (data) => {
        try {
            // 攻撃ポイントを確認してボスのページへ攻撃コマンドを送る
            let point = data["point"];
            
            sendData(bossSocketID, Command.Attack, true, {"point": point});
        } catch (error) {
            // エラーだった場合はエラー文をクライアントに返す
            console.log(error);
            if (error instanceof Error) {
                sendData(socket.id, Command.Attack, false, error.message);
            }
        }
    });
});

// クライアントにデータを送信する
function sendData(socketID: string, command: string, state: boolean, data: string | Object) {
    io.to(socketID).emit(command, {state, data});
}
  
httpServer.listen(8080, () => {
    console.log("Chat server listening on port 8080");
});
