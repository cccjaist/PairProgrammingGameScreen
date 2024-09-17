import React from 'react';

// ゲームのステータス一覧を定義
export type DialogStatus = "signup_success" | "signup_failed" | "signin_failed" |  "ready" | "error" | "correct" | "incorrect" | "none";

// 全てのステータスでダイアログメッセージとOKボタン表示有無を定義するよう制約
type Message = {
  [key in DialogStatus]: string;
};
type IsButtonCall = {
  [key in DialogStatus]: boolean;
}

// ダイアログメッセージ一覧
let message: Message = {
  signup_success: "サインアップに成功しました",
  signup_failed: "サインアップに失敗しました",
  signin_failed: "サインインに失敗しました",
  ready : "よみこみ中…",
  error : "エラーがおきました。もう一度ゲームをひらいてください。",
  correct : "せいかい！",
  incorrect : "ふせいかい…",
  none : ""
};

// OKボタン表示有無一覧
let IsButtonCall: IsButtonCall = {
  signup_success: true,
  signup_failed: true,
  signin_failed: true,
  ready : false,
  error : false,
  correct : true,
  incorrect : true,
  none : false
};

export type ModalProps = {
  open: boolean;
  status: DialogStatus;
  onCancel: () => void;
  onOk: () => void;
};

const Modal = (props: ModalProps) => {
  return props.open ? (
    <>
      <div className="bg-white  top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-48 p-5 flex flex-col items-start absolute z-20">
        <h1 className="text-xl font-bold mb-5">{message[props.status]}</h1>
        {/* <p className="text-lg mb-5">Dialog Message.</p> */}
        <div className="flex mt-auto w-full">
          { IsButtonCall[props.status] ? (
            <button
            className="bg-slate-900 hover:bg-slate-700 text-white px-8 py-2 mx-auto"
            onClick={() => props.onOk()}>
            OK
            </button>
          ): null }
        </div>
      </div>
      <div
        className="fixed bg-black bg-opacity-50 w-full h-full z-10"
        onClick={() => props.onCancel()}
      ></div>
    </>
  ) : (
    <></>
  );
};

export default Modal;