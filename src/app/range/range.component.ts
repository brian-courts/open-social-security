import { Component, OnInit, Input, AfterViewInit, ViewChild, ElementRef } from '@angular/core'
import { CalculationScenario } from '../data model classes/calculationscenario'
import { MonthYearDate } from '../data model classes/monthyearDate'
import { Person } from '../data model classes/person'
import { Range } from '../data model classes/range'
import { ClaimDates } from '../data model classes/claimDates'

/* 
This component provides a means of graphically displaying the quality of
any possible claiming date (or, for a couple, combination of claiming dates).
The "quality" measured is the percentage of the maximum expected PV calculated.
As users interact with the chart, they see immediately that percentage for each
claiming strategy, and they can select a specific strategy for further information. 
 */

// convenience constants to avoid references to a different class
const NO_CUT = Range.NO_CUT
const CUT = Range.CUT

@Component({
  selector: 'app-range',
  templateUrl: './range.component.html',
  styleUrls: ['./range.component.css']
})

export class RangeComponent implements OnInit, AfterViewInit {
  canvasWidth: number;
  canvasHeight: number;
  currentCondition: number;

  @ViewChild('canvas0') canvasRef: ElementRef;

  @Input() scenario: CalculationScenario
  @Input() personA: Person
  @Input() personB: Person
  @Input() homeSetCustomDates: Function

  // for display of quality of options
  canvas: HTMLCanvasElement;
  canvasContext: CanvasRenderingContext2D

/* 
  // for possible future view-switch enhancement
  showCutButton: HTMLInputElement;
  showNoCutButton: HTMLInputElement;
 */

  updating: boolean = false; // true if user has pointer over the graph
  
  // items relating to the selected option (clicked by user)
  selectedRow: number = -1;
  selectedCol: number = -1;
  selectedPercentString: string = ""; // string with percent of maximum PV at selected option
  selectedClaimDatesString: string; // string with claim dates for no-cut condition at selected option
  selectedClaimDatesStringCut: string; // string with claim dates for cut condition at selected option

  // items relating to the option under the pointer (as user hovers)
  previousPointerRow: number = -1; 
  previousPointerColumn: number = -1;
  pointerPercentString: string = "";
  pointerClaimDatesStringNoCut: string;
  pointerClaimDatesStringCut: string;

  range: Range; // the object holding data for the range of options
  startDateA: MonthYearDate; // date at which personA first receives benefits, to be used when converting row to date
  startDateB: MonthYearDate; // date at which personB first receives benefits, to be used when converting column to date
  
  // - - - - - - graph parameters - - - - - -

  cellWidth: number;
  cellHeight: number;
  minimumCellWidth: number = 6;
  minimumCellHeight: number = 6;
  chartTitleStr: string;

  axisWidth: number = 2; // width of x- or y-axis
  halfAxisWidth: number = this.axisWidth / 2;
  axisColor: string = 'gray';
  axisTitleFontSize = 16;
  axisTitleFont: string = this.axisTitleFontSize + 'px sans-serif';
  axisLabelFontSize = 16;
  axisLabelFont: string = this.axisLabelFontSize + 'px sans-serif';
  chartTitleFontSize = 18;
  chartTitleFont: string = 'bold ' + this.chartTitleFontSize + 'px serif';
  chartTitleHeight: number;
  axisTickSize: number = 10;
  axisLabelSpace: number = 5;
  xAxisTitleSingle: string = "You Start Retirement";
  xAxisTitleCouple: string = "You Start Own Retirement";
  xAxisTitle: string = this.xAxisTitleSingle;
  yAxisTitle: string = "Spouse Starts Own Retirement";
  xTitleWidth: number;
  xTitleHeight: number;
  yTitleWidth: number;
  yTitleHeight: number;
  labelWidth: number;
  labelHeight: number;

  // margins adjacent to axes
  xMarginWidth: number;
  xMarginHeight: number;
  yMarginWidth: number;
  yMarginHeight: number;

  // base for calculating location of cells
  cellBaseX: number;
  cellBaseY: number;
  rowBaseY: number;

  keySpace: number; // between bottom of chart title and top of key
  keyBorderWidth: number = 2; // width of border around color key for display
  keyBorderColor: string = '#808080';
  keyLabelFontHeight: number = 16;
  keyLabelFont: string = this.keyLabelFontHeight + 'px sans-serif';
  keyCellCount: number;
  keyCellWidth: number = 40;
  keyCellHeight: number = 30;
  keyCellsWidth: number;
  keyWidth: number;
  keyHeight: number;
  keyTop: number;
  keyLeft: number;

  markWidth: number = 2; // width of line marking selected cell or cell at pointer
  halfMarkWidth: number = this.markWidth/2; // width of line marking selected cell or cell at pointer

  selectedColor = 'black'; // mark of selected cell
  pointerColor = 'rgb(250, 250, 20)'; // yellow, border around cell at pointer location

  constructor() {
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    console.log("range.component.ngAfterViewInit");
    this.initDisplay();
  }

  initDisplay() {
    this.range = this.scenario.range;
    if (!this.range) {
      console.log("this.scenario.range is undefined or null.");
    } else {

      this.startDateA = this.range.firstDateA;
      this.startDateB = this.range.firstDateB;
      this.selectedPercentString = "";
      this.selectedRow = -1;
      this.selectedCol = -1;

      if (this.scenario.benefitCutAssumption === false) {
        this.currentCondition = NO_CUT;
        this.chartTitleStr = "% of Maximum PV"
      } else {
        this.currentCondition = CUT;
        this.chartTitleStr = "% of Maximum PV (If Cut of " + 
          this.scenario.benefitCutPercentage + "% at " +
          this.scenario.benefitCutYear + ")"
      }

      // get elements where information will be displayed
      this.canvas = this.canvasRef.nativeElement;
      this.canvasContext = this.canvas.getContext("2d");

/* 
  // for possible future view-switch enhancement
      this.showCutButton = <HTMLInputElement> document.getElementById("showCut");
      this.showNoCutButton = <HTMLInputElement> document.getElementById("showNoCut");
*/

      this.setSizes(this.range.rows, this.range.columns);

      this.cellBaseX = this.yMarginWidth + this.axisWidth;
      this.cellBaseY = this.cellHeight * (this.range.rows - 1);
      this.rowBaseY = (this.cellHeight * this.range.rows) - 1;

      this.selectedClaimDatesString = "";
      this.pointerClaimDatesStringNoCut = "";
      this.pointerClaimDatesStringCut = "";

      this.paintCanvas(this.currentCondition);
  }
}
/* 
// for possible future view-switch enhancement
showCut(): void {
  this.showCutButton.checked = true;
  this.showNoCutButton.checked = false;
  console.log("showing Cut");
}

showNoCut(): void {
  this.showNoCutButton.checked = true;
  this.showCutButton.checked = false;
  console.log("showing NoCut");
}
*/

  updateDisplay(event: Event) {
    this.initDisplay();
  }

  setSizes(rows: number, cols: number): void {
    // need to call this whenever change in rows or columns
    // i.e., different number of possible claim date combinations 

    let maxCells = this.range.rows;
    if (maxCells < this.range.columns) {
      maxCells = this.range.columns;
    }

    this.setKeySize();

    let maximumCanvasDimension = 500;
    this.cellWidth = Math.floor(Math.max(maximumCanvasDimension/maxCells, this.minimumCellWidth));
    this.cellHeight = Math.floor(Math.max(this.cellWidth, this.minimumCellHeight));

    if (rows === 1) {
      // single person
      this.xAxisTitle = this.xAxisTitleSingle;
      if (this.cellHeight < 20) {
        // increase height for better visibility of single-row (one-person) display
        this.cellHeight = 20;
      }
    } else {
      this.xAxisTitle = this.xAxisTitleCouple;
    }

    // Calculate chart element dimensions to fit actual axis contents
    let context:CanvasRenderingContext2D = this.canvasContext;
    context.font = this.axisTitleFont;
    this.xTitleWidth = context.measureText(this.xAxisTitle).width;
    this.xTitleHeight = this.axisTitleFontSize * 1.5;
    this.yTitleWidth = context.measureText(this.yAxisTitle).width;      
    this.yTitleHeight = this.axisTitleFontSize * 1.5;
    this.chartTitleHeight = this.chartTitleFontSize * 2;
    this.keySpace = this.chartTitleFontSize;
    context.font = this.axisLabelFont;
    this.labelWidth = context.measureText("2020").width;
    this.labelHeight = this.axisLabelFontSize * 1.5;

    let cellsWidth = (this.range.columns * this.cellWidth); // width of all cells
    this.xMarginWidth = Math.max(cellsWidth, this.xTitleWidth, this.yTitleWidth, this.keyWidth);
    this.xMarginWidth = Math.floor(this.xMarginWidth + 1);

    this.xMarginHeight = Math.floor(this.axisLabelSpace + this.labelHeight + 
      this.xTitleHeight + this.chartTitleHeight + this.keySpace + 1);
    if (rows > 0) {
      // this is a couple
      this.xMarginHeight += Math.floor(this.yTitleHeight + 1);
    }

    if (rows === 1) {
      this.yMarginWidth = 0;
    } else {
      this.yMarginWidth = Math.floor(this.labelWidth + this.axisLabelSpace + 1);
    }
    this.yMarginHeight = Math.floor(this.range.rows * this.cellHeight + 1);

    this.canvasWidth = this.yMarginWidth + this.axisWidth + this.xMarginWidth;
    this.canvasHeight = this.xMarginHeight + this.axisWidth + this.yMarginHeight + this.keyHeight;
    this.canvas.width = this.canvasWidth;
    this.canvas.height = this.canvasHeight;
  }

  // get x, y coordinates of upper left corner of cell at row, col
  getCellUpperLeft(row: number, col: number): number[] {
    // leaving space for border around cells
    let ulX: number = this.cellBaseX + (col * this.cellWidth);
    let ulY: number = this.cellBaseY - (row * this.cellHeight);
    return [ulX, ulY];
  }

  paintCell(condition: number, row: number, col: number) {
    let color: string;
    let upperLeft: number[] = this.getCellUpperLeft(row, col); // ul[0] = x, ul[1] = y
    color = this.range.getColor(condition, row, col);
    this.canvasContext.fillStyle = color;
    this.canvasContext.fillRect(upperLeft[0], upperLeft[1], this.cellWidth, this.cellHeight);
  }

  paintMargins() {
    let context: CanvasRenderingContext2D = this.canvasContext;
    context.strokeStyle = this.axisColor;
    context.lineWidth = this.axisWidth;
    let isCouple: boolean = this.range.rows > 1;
    
    // draw y-axis and x-axis
    let axisLeft: number = this.cellBaseX - this.halfAxisWidth;
    let axisRight: number = this.cellBaseX + (this.range.columns * this.cellWidth);
    let axisBottom: number = this.cellBaseY + this.cellHeight + this.halfAxisWidth;
    let axisTop: number = 0; // works for couple
    if (!isCouple) {
      axisTop = axisBottom;
    }    
    context.beginPath();
    context.moveTo(axisLeft, axisTop);
    context.lineTo(axisLeft, axisBottom);
    context.lineTo(axisRight, axisBottom);
    context.stroke();

    // add x-axis title
    let titleX = axisLeft + (this.xMarginWidth / 2);
    let titleY = axisBottom + this.labelHeight + this.xTitleHeight;
    context.font = this.axisTitleFont;
    context.fillStyle = 'black';
    context.textAlign = 'center';
    context.fillText(this.xAxisTitle, titleX, titleY);

    if (isCouple) {
      // add y-axis title
      titleY += this.yTitleHeight;
      titleX = axisLeft;
      context.font = this.axisTitleFont;
      context.fillStyle = 'black';
      context.textAlign = 'center';
      context.textAlign = 'left';
      context.fillText(this.yAxisTitle, titleX, titleY);
      // draw arrow towards yMargin
      context.beginPath();
      let fontSize = this.axisTitleFontSize;
      let arrowheadBottom = axisBottom + fontSize;
      context.moveTo(titleX - 5, titleY - (fontSize / 2)); 
      let turnX: number = titleX - this.yMarginWidth / 2
      context.lineTo(turnX, titleY - fontSize/2);
      context.lineTo(turnX, axisBottom);
      context.lineTo(turnX - fontSize/2, arrowheadBottom);
      context.lineTo(turnX + fontSize/2, arrowheadBottom);
      context.lineTo(turnX, axisBottom);
      context.stroke();
    }

    // add chart title
    context.font = this.chartTitleFont;
    context.fillStyle = 'black';
    context.textAlign = 'center';
    titleY += this.chartTitleHeight;
    titleX = this.canvasWidth / 2;
    context.fillText(this.chartTitleStr, titleX, titleY);

    // add key
    this.drawKey(this.currentCondition, titleX - (this.keyWidth / 2), titleY + this.chartTitleFontSize);

    // add x-axis tick marks and year labels
    let tickTop: number = axisBottom + this.halfAxisWidth;
    let tickBottom: number = tickTop + this.axisTickSize;
    let tickX: number = axisLeft;
    let nextX: number;

    let labelX: number;
    let labelY: number = tickTop + this.labelHeight;
    context.font = this.axisLabelFont;
    context.fillStyle = 'black';
    context.textAlign = 'center';
    
    let year = this.range.firstYearA;
    for (let i = 0; i < this.range.yearMarksA.length; i++) {
      context.beginPath();
      context.moveTo(tickX, tickTop);
      context.lineTo(tickX, tickBottom);
      context.stroke();
      if (i < this.range.yearMarksA.length - 1) {
        // draw label for this range
        nextX = this.cellBaseX + (this.range.yearMarksA[i + 1] * this.cellWidth)
        if ((nextX - tickX) > this.labelWidth) {
          labelX = (nextX + tickX) / 2;
          context.fillText(year.toString(), labelX, labelY);
        }
        year++;
        tickX = nextX;
      }
    }

    if (isCouple) {
      // add y-axis tick marks and year labels
      year = this.range.firstYearB;
      context.textAlign = 'right';
      let tickRight: number = axisLeft - this.halfAxisWidth;
      let tickLeft: number = tickRight - this.axisTickSize;
      let tickY: number = axisBottom;
      let nextY: number;
      let labelX: number = tickRight - this.axisLabelSpace;
      for (let i = 0; i < this.range.yearMarksB.length; i++) {
        context.beginPath();
        context.moveTo(tickLeft, tickY);
        context.lineTo(tickRight, tickY);
        context.stroke();
        if (i < this.range.yearMarksB.length - 1) {
          // draw label for this range
          nextY = this.rowBaseY - ((this.range.yearMarksB[i + 1]) * this.cellWidth)
          if ((tickY - nextY) > this.labelHeight) {
            labelY = (nextY + tickY) / 2 + this.axisLabelFontSize/2;
            context.fillText(year.toString(), labelX, labelY);
          }
          year++;
          tickY = nextY;
        }
      }
    }
  }

  paintCanvas(condition: number) {
    this.canvasContext.strokeStyle = this.axisColor;
    this.canvasContext.lineWidth = this.axisWidth;

    this.paintMargins();
    
    for (let row = 0; row < this.range.rows; row++) {
      for (let col = 0; col < this.range.columns; col++) {
        this.paintCell(condition, row, col);
      }
    }
  }

  clearData() {
    this.pointerClaimDatesStringNoCut = '';
    this.pointerClaimDatesStringCut = '';

    this.pointerPercentString = '';
  }

 fractionToPercent(num: number, places: number) {
    return (num * 100).toFixed(places);
  }

  showSelectedOption(row: number, col: number, ) {
    let selectedClaimDates: ClaimDates = this.range.claimDatesArrays[this.currentCondition][row][col];
    console.log("row: " + row)
    console.log("col: " + col)
    this.selectedClaimDatesString = selectedClaimDates.benefitDatesString();
    let expectedPvPercent: string = this.fractionToPercent(this.range.getPvFraction(this.currentCondition, row, col), 1);
    // this.pctSelStr = "Expected PV = $" + expectedPvStr + ", " + expectedPvPct + "% of max. PV";
    this.selectedPercentString = "Expected PV = " + expectedPvPercent + "% of maximum PV";
    if (this.currentCondition == CUT) {
      let expectedPvPercentNoCut: string = this.fractionToPercent(this.range.getPvFraction(CUT, row, col), 1);
      this.selectedPercentString += 
        " if cut of " +
        this.scenario.benefitCutPercentage + "% at " +
        this.scenario.benefitCutYear;
        expectedPvPercentNoCut + 
        " if no cut"; 
    }
    // if (this.currentCondition == CUT) {
    //   let selectedClaimDatesCut = this.range.claimDatesArrays[CUT][row][col];
    //   // TODO: show only if dates different for CUT case
    //   this.selectedClaimDatesStringCut = selectedClaimDatesCut.benefitDatesString();
    // }
  }

  getRowColumn(e: MouseEvent) { // returnValue[0] = x, returnValue[1] = y
    let xy = this.getXY(e);
    let x = xy[0];
    let y = xy[1];
    let row = Math.floor((this.rowBaseY - y) / this.cellHeight);
    let column = Math.floor((x - this.cellBaseX) / this.cellWidth);
    // row & column should not be out of range, but just in case:
    if (row >= this.range.rows) {
      row = this.range.rows - 1
    }
    if (column >= this.range.columns) {
      column = this.range.columns - 1
    } 
    return [row, column];
  }

  getXY(e: MouseEvent) {
    // Find the position of the mouse.
    let x = e.pageX - this.canvas.offsetLeft;
    let y = e.pageY - this.canvas.offsetTop;
    return [x, y];
  }

  unmarkCell(markedRow: number, markedCol: number) {
    if (markedRow >= 0 && markedCol >= 0) {
      this.paintCell(this.currentCondition, markedRow, markedCol);
    }
  }

  markCell(markColor: string, markRow: number, markColumn: number) {
    if (markRow >= 0 && markColumn >= 0) { // to avoid marking the initial selected cell at (-1, -1)
      let ul: number[] = this.getCellUpperLeft(markRow, markColumn);
      this.canvasContext.lineWidth = this.markWidth;
      this.canvasContext.strokeStyle = markColor;
      // Marking cell at the pointer with a rectangle
      this.canvasContext.strokeRect(ul[0] + this.halfMarkWidth, ul[1] + this.halfMarkWidth, 
      this.cellWidth - this.markWidth, this.cellHeight - this.markWidth);
    }
  }

  selectCell(event: MouseEvent) {
    let rowColumn = this.getRowColumn(event);
    // save location of newly-selected cell
    let selectRow = rowColumn[0];
    let selectColumn = rowColumn[1];
    if ((selectRow >= 0) && (selectColumn >= 0)) {
      // unmark the previously-selected cell
      this.unmarkCell(this.selectedRow, this.selectedCol);
      // mark the newly-selected cell
      this.markCell(this.selectedColor, selectRow, selectColumn);
      // save selected cell row & col for other operations 
      this.selectedRow = selectRow;
      this.selectedCol = selectColumn;
      this.showSelectedOption(this.selectedRow, this.selectedCol);
      // this.showPct(this.selectedRow, this.selectedCol, this.pctSelStr);
      let condition: number = NO_CUT;
      if (this.scenario.benefitCutAssumption) {
        condition = CUT;
      }
      let expectedPvString: string = Math.round(this.range.getPv(condition, selectRow, selectColumn)).toLocaleString();
      let expectedPvPercentString: string = this.fractionToPercent(this.range.getPvFraction(this.currentCondition, selectRow, selectColumn), 1);
      this.selectedPercentString = "Expected PV = $" + expectedPvString + ", " + expectedPvPercentString + "% of maximum PV";
      if (this.currentCondition > NO_CUT) {
        let expectedPvPercentNoCut: string = this.fractionToPercent(this.range.getPvFraction(NO_CUT, selectRow, selectColumn), 1);
        this.selectedPercentString += " (" + expectedPvPercentNoCut + "% if no cut)";
      }
    }
}

  startUpdating(e) {
    // Start updating displayed values, per location of pointer
    this.updating = true;
  }

  // unmark the pointer location
  unmarkPointer() {
    this.unmarkCell(this.previousPointerRow, this.previousPointerColumn);
    if ((this.previousPointerRow === this.selectedRow) && (this.previousPointerColumn === this.selectedCol)) {
      // if the most recent pointer location was the selected cell, re-mark it
      this.markCell(this.selectedColor, this.selectedRow, this.selectedCol);
    }
  }

  stopUpdating() {
    this.updating = false;
    this.unmarkPointer();
    this.clearData();
  }

update(e: MouseEvent) {
    let rowColumn = this.getRowColumn(e);
    let row = rowColumn[0];
    let column = rowColumn[1];

    this.unmarkPointer();

    if ((row >= 0) && (column >= 0)) { // pointer is within the graph area (not the margin)
      // mark the pointer location, even if it is the selected cell
      this.markCell(this.pointerColor, row, column)
      this.previousPointerRow = row;
      this.previousPointerColumn = column;
      let claimsString = this.range.rowColumnDatesString(row, column);
      this.pointerPercentString = this.fractionToPercent(this.range.getPvFraction(this.currentCondition, row, column), 1) + "% of maximum, " + claimsString;
      if (this.currentCondition > NO_CUT) {
        let expectedPvPercentNoCut: string = this.fractionToPercent(this.range.getPvFraction(NO_CUT, row, column), 1);
        this.pointerPercentString += " (" + expectedPvPercentNoCut + "% if no cut)";
      }
      this.canvas.title = this.pointerPercentString; // show tooltip with % of maximum
    } else {
      this.canvas.title = ""; // blank tooltip when outside of graph
    }
  }

  setKeySize() {
    // determine location and size of key components

    this.keyCellsWidth = (this.keyCellWidth * this.range.fractionLabels.length);
    this.keyWidth = this.keyCellsWidth + this.keyBorderWidth * 2;
    this.keyHeight = this.keyCellHeight + (this.keyBorderWidth * 2) + this.keyLabelFontHeight * 1.5;
    
  }

  drawKey(condition: number, keyLeft: number, keyTop: number): void {
    let context: CanvasRenderingContext2D = this.canvasContext;
    let borderWidth = this.keyBorderWidth;
    let halfWidth = borderWidth / 2; 

    let cellsLeft = keyLeft + borderWidth;
    let cellsTop = keyTop + this.keyBorderWidth;
    let borderLeft = cellsLeft - halfWidth;
    let borderTop = cellsTop - halfWidth;
    context.strokeStyle = this.keyBorderColor;
    context.lineWidth = this.keyBorderWidth;
    context.strokeRect(borderLeft, borderTop, this.keyCellsWidth + borderWidth, 
      this.keyCellHeight + borderWidth);
    
    // paint key cells and key cell labels
    let keyCellCount = this.range.fractionLabels.length;
    let cellX = cellsLeft;
    let labelY = cellsTop + this.keyCellHeight + (this.keyBorderWidth * 2) + this.keyLabelFontHeight;
    context.fillStyle = 'black';
    context.textAlign ='left';
    context.font = this.keyLabelFont;
    context.textAlign ='center';
    // which key element is being painted - higher array index for lower % of maximum
    let fractionNumber = keyCellCount - 1; 
    for (let i = 0; i < keyCellCount; i++) {
      context.fillStyle = this.range.colorByNumber[condition][fractionNumber];
      context.fillRect(cellX, cellsTop, this.keyCellWidth, this.keyCellHeight);
      context.fillStyle = 'black';
      context.fillText(this.range.fractionLabels[fractionNumber], cellX, labelY);
      cellX += this.keyCellWidth;
      fractionNumber--;
    }
  }

}
