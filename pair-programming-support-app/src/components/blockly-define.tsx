// Import Blockly core.
import * as Blockly from 'blockly/core';
// Import the default blocks.
import * as libraryBlocks from 'blockly/blocks';
// Import a generator.
import {javascriptGenerator} from 'blockly/javascript';

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
  Blockly.Blocks['flag_if_else'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("もし旗の形が");
      this.appendDummyInput()
          .appendField(new Blockly.FieldDropdown([["三角","triangle"], ["四角","squareflag"]]), "flagShape");
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
  Blockly.Blocks['custom_loop_times'] = {
    init: function() {
      this.appendDummyInput()
          .appendField(new Blockly.FieldNumber(0, 0, 100), "loop_times_num");
      this.appendDummyInput()
          .appendField("回くり返す");
      this.appendStatementInput("loop_function")
          .setCheck(null);
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(60);
   this.setTooltip("");
   this.setHelpUrl("");
    }
  };
  
  // 「スタート」ブロックをjsに変換するときの処理
  javascriptGenerator.forBlock['start'] = function(_, __) {
    // TODO: Assemble javascript into code variable.
    var code = '...\n';
    return code;
  };
  
  // 「〇方向に〇歩動く」ブロックをjsに変換するときの処理
  javascriptGenerator.forBlock['move'] = function(block, _) {
    var dropdown_angle = block.getFieldValue('angle');
    var number_steps = block.getFieldValue('steps');
    // TODO: Assemble javascript into code variable.
    var code = 'alert("'+ dropdown_angle + '方向に' + number_steps + '歩動く");\n';
    return code;
  };
  
  // 「もし旗の形が〇なら～でなければ～」ブロックをjsに変換するときの処理
  javascriptGenerator.forBlock['flag_if_else'] = function(block, generator) {
    var dropdown_flagshape = block.getFieldValue('flagShape');
    var statements_true_function = generator.statementToCode(block, 'true-function');
    var statements_false_function = generator.statementToCode(block, 'false-function');
    // TODO: Assemble javascript into code variable.
    var code = '...\n';
    return code;
  };
  
  // 「〇回繰り返す」ブロックをjsに変換するときの処理
  javascriptGenerator.forBlock['custom_loop_times'] = function(block, generator) {
    var number_loop_times_num = block.getFieldValue('loop_times_num');
    var statements_loop_function = generator.statementToCode(block, 'loop_function');
    // TODO: Assemble javascript into code variable.
    var code = '...\n';
    return code;
  };