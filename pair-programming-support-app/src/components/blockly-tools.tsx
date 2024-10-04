// Import Blockly core.
import * as Blockly from 'blockly/core';
// Import the default blocks.
import * as libraryBlocks from 'blockly/blocks';
// Import a generator.
import {javascriptGenerator} from 'blockly/javascript';

import { MAP_COL_SIZE, MAP_ROW_SIZE} from "../components/map";


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
        .appendField(new Blockly.FieldDropdown([["上","up"], ["下","down"], ["右","right"], ["左","left"]]), "angle");
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

// 「もし旗の形が〇なら～」ブロックの定義
Blockly.Blocks['flag-if'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("もし旗の形が")
        .appendField(new Blockly.FieldDropdown([["三角","tile-triangle-flag"], ["四角","tile-square-flag"]]), "flag-shape")
        .appendField("なら");
    this.appendStatementInput("true-function")
        .setCheck(null);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(60);
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
        .appendField(new Blockly.FieldDropdown([["三角","tile-triangle-flag"], ["四角","tile-square-flag"]]), "flag-shape");
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
    this.setColour(150);
 this.setTooltip("");
 this.setHelpUrl("");
  }
};

// 「までくり返す」ブロックの定義
Blockly.Blocks['flag-while'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([["三角","tile-triangle-flag"], ["四角","tile-square-flag"]]), "flag-shape")
        .appendField("の旗の上に立つまでくり返す");
    this.appendStatementInput("loop-function")
        .setCheck(null);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(150);
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
      // 指定された座標にいるエージェントを移動させる
      // 全ての移動終了後、ゴールに到達している場合はtrue、到達していない場合はfalseを返す
      function execute(pos, tileName) {
      // 2体目のエージェントが存在しない場合は処理を行わずtrueを返す
      if (pos == -1) {
        return true;
      }
      
      // エージェントの座標を初期化
      let agentPos = pos;
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

        // エージェントの座標を更新
        switch("${dropdownAngle}") {
            case "up":
                agentPos -= ${MAP_ROW_SIZE};
                break;
            case "down":
                agentPos += ${MAP_ROW_SIZE};
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
        setViewTileByName(tileName, agentPos);
        // 古い座標に矢印を配置
        setViewTileByName("tile-${dropdownAngle}", pastAgentPos);

        // エージェントが端に到達した(炎に当たった)場合の処理
        // 問題に不正解したのでfalseを返して処理を終了する
        if (getTileImageName(agentPos, questionNum) == "tile-flame") {
            return false;
        }
    }    
  `;

  return code;
};

// 「もし旗の形が〇なら～」ブロックをjsに変換する時の処理
javascriptGenerator.forBlock['flag-if'] = function(block, generator) {
  var dropdownFlagShape = block.getFieldValue('flag-shape');
  var statementsTrueFunction = generator.statementToCode(block, 'true-function');
  var code = `
      if (getTileImageName(agentPos, questionNum) == "${dropdownFlagShape}") {
      // 一致した場合はもし～の中の処理を実行する
      ${statementsTrueFunction}
      }
  `;
  return code;
};

// 「もし旗の形が〇なら～でなければ～」ブロックをjsに変換するときの処理
javascriptGenerator.forBlock['flag-if-else'] = function(block, generator) {
  var dropdownFlagShape = block.getFieldValue('flag-shape');
  var statementsTrueFunction = generator.statementToCode(block, 'true-function');
  var statementsFalseFunction = generator.statementToCode(block, 'false-function');

  var code = `
      // エージェントの座標のタイル名と「もし○○なら」ブロックの○○が一致するか確認
      if (getTileImageName(agentPos, questionNum) == "${dropdownFlagShape}") {
          // 一致した場合はもし～の中の処理を実行する
          ${statementsTrueFunction}
      } else {
          // 不一致の場合はでなければの中の処理を実行する
          ${statementsFalseFunction}
      }
  `;
  return code;
};

// 「〇回くり返す」ブロックをjsに変換するときの処理
javascriptGenerator.forBlock['custom-loop-times'] = function(block, generator) {
  var loopTimesNum = block.getFieldValue('loop-times-num');
  var statementsLoopFunction = generator.statementToCode(block, 'loop-function');

  var code = `
      for (var i = 0; i < ${loopTimesNum}; i++) {
          ${statementsLoopFunction}
      }
      `;

  return code;
};

// 「までくり返す」ブロックをjsに変換する時の処理
javascriptGenerator.forBlock['flag-while'] = function(block, generator) {
  var dropdownFlagShape = block.getFieldValue('flag-shape');
  var statementsLoopFunction = generator.statementToCode(block, 'loop-function');

  var code = `
        while (getTileImageName(agentPos, questionNum) != "${dropdownFlagShape}") {
          ${statementsLoopFunction}
        }
        `;
  return code;
};

// 「ゴール」ブロックをjsに変換するときの処理
javascriptGenerator.forBlock['goal'] = function(block, generator) {
  var code = `
          // エージェントの座標にエージェントのタイルを表示させる
          //setViewTileByName(tileName, agentPos);

          // エージェントがゴール上に立っているかチェック
          // 立っていればtrue・それ以外はfalseがisReachに格納される
          return isAgentFinished(agentPos);
      }
      
      // 2つのエージェントを移動させ、それぞれゴールに到達できたか判定
      let isAgent1ReachGoal = execute(getQuestionAgentPos(questionNum, 0), "tile-agent");
      let isAgent2ReachGoal = execute(getQuestionAgentPos(questionNum, 1), "tile-agent2");
      isReach = isAgent1ReachGoal && isAgent2ReachGoal;
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
        "type": "goal"
      },
      {
        "kind": "block",
        "type": "move"
      },
      {
        "kind": "block",
        "type": "flag-if"
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
        "type": "flag-while"
      },     
    ]
  }

export default toolbox;