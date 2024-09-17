// Import Blockly core.
import * as Blockly from 'blockly/core';
// Import the default blocks.
import * as libraryBlocks from 'blockly/blocks';
// Import a generator.
import {javascriptGenerator} from 'blockly/javascript';

import { mapColSize, mapRowSize, getMapID, tileImageName, questionMap } from "../components/map";


// 「スタート」ブロックの定義
Blockly.Blocks['start'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("スタート");
    this.setInputsInline(true);
    this.setNextStatement(true, null);
    this.setColour(0);
 this.setTooltip("");
 this.setHelpUrl("");
  }
};

// 「〇方向へ〇歩移動する」ブロックの定義
Blockly.Blocks['move'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([["上","top"], ["下","down"], ["右","right"], ["左","left"]]), "angle");
    this.appendDummyInput()
        .appendField("方向へ");
    this.appendDummyInput()
        .appendField(new Blockly.FieldNumber(0), "steps");
    this.appendDummyInput()
        .appendField("歩動く");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(230);
 this.setTooltip("");
 this.setHelpUrl("");
  }
};

// 「もし旗の形が〇なら～でなければ～」ブロックの定義
Blockly.Blocks['flag-if-else'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("もし旗の形が");
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([["三角","tile-triangle-flag"], ["四角","tile-square-flag"]]), "flagShape");
    this.appendDummyInput()
        .appendField("なら");
    this.appendStatementInput("true-function")
        .setCheck(null);
    this.appendDummyInput()
        .appendField("そうでなければ");
    this.appendStatementInput("false-function")
        .setCheck(null);
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(60);
 this.setTooltip("");
 this.setHelpUrl("");
  }
};

// 「〇回くり返す」ブロックの定義
Blockly.Blocks['custom-loop-times'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(new Blockly.FieldNumber(0, 0, 100), "loop-times-num");
    this.appendDummyInput()
        .appendField("回くり返す");
    this.appendStatementInput("loop-function")
        .setCheck(null);
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(60);
 this.setTooltip("");
 this.setHelpUrl("");
  }
};

// 「ゴール」ブロックの定義
Blockly.Blocks['goal'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("ゴール");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setColour(0);
 this.setTooltip("");
 this.setHelpUrl("");
  }
};

// 「スタート」ブロックをjsに変換するときの処理
javascriptGenerator.forBlock['start'] = function(_, __) {
  var code = `
      function execute() {
      `;
  return code;
};

// 「〇方向に〇歩動く」ブロックをjsに変換するときの処理
javascriptGenerator.forBlock['move'] = function(block, _) {
  var dropdownAngle = block.getFieldValue('angle');
  var numberSteps = block.getFieldValue('steps');

  

  var code = `
    // 1歩動く処理を歩数回分繰り返す
    for (let i = 0; i < ${numberSteps}; i++) {
        // 移動前の座標を保存
        let pastAgentPos = agentPos;
        // 右端と左端の座標を特定
        let leftEdge = Math.floor(agentPos / ${mapColSize}) * ${mapColSize};
        let rightEdge = leftEdge + ${mapColSize} - 1;

        // エージェントの座標を更新
        switch("${dropdownAngle}") {
            case "top":
                agentPos -= ${mapRowSize};
                break;
            case "down":
                agentPos += ${mapRowSize};
                break;
            case "right":
                agentPos++;
                break;
            case "left":
                agentPos--;
                break;
        }

        // 駒の表示を移動させる処理
        // 新しい座標にエージェントを配置
        setViewTileByName("tile-agent", agentPos);
        // 古い座標に矢印を配置
        setViewTileByName("tile-${dropdownAngle}", pastAgentPos);

        // エージェントが端に到達した(炎に当たった)場合の処理
    }    
  `;

  return code;
};

// 「もし旗の形が〇なら～でなければ～」ブロックをjsに変換するときの処理
javascriptGenerator.forBlock['flag-if-else'] = function(block, generator) {
  var dropdownFlagshape = block.getFieldValue('flagShape');
  var statementsTrueFunction = generator.statementToCode(block, 'true-function');
  var statementsFalseFunction = generator.statementToCode(block, 'false-function');

  var code = `
      // エージェントの座標のタイル名と「もし○○なら」ブロックの○○が一致するか確認
      //console.log(getTileImageName(agentPos, questionNum));
      if (getTileImageName(agentPos, questionNum) == "${dropdownFlagshape}") {
          // 一致した場合はもし～の中の処理を実行する
          ${statementsTrueFunction}
      } else {
          // 不一致の場合はでなければの中の処理を実行する
          ${statementsFalseFunction}
      }
  `;
  return code;
};

// 「〇回繰り返す」ブロックをjsに変換するときの処理
javascriptGenerator.forBlock['custom-loop-times'] = function(block, generator) {
  var numberLoopTimesNum = block.getFieldValue('loop-times-num');
  var statementsLoopFunction = generator.statementToCode(block, 'loop-function');

  var code = `
      for (var i = 0; i < ${numberLoopTimesNum}; i++) {
          ${statementsLoopFunction}
      }
      `;

  return code;
};

// 「ゴール」ブロックをjsに変換するときの処理
javascriptGenerator.forBlock['goal'] = function(block, generator) {
  var code = `
      isCorrect = isAgentFinished();
      return;
      `;
  return code;
};

// ゲームに表示するツールボックス
const toolbox = {
    "kind": "flyoutToolbox",
    "contents": [
      {
        "kind": "block",
        "type": "start"
      },
      {
        "kind": "block",
        "type": "move"
      },
      {
        "kind": "block",
        "type": "flag-if-else"
      },
      {
        "kind": "block",
        "type": "custom-loop-times"
      },
      {
        "kind": "block",
        "type": "goal"
      },
    ]
  }

export default toolbox;