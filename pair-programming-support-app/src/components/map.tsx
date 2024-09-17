export const mapRowSize = 8;
export const mapColSize = 8;

export function getMapID(colNum:number, rowNum:number) {
    return rowNum * mapRowSize + colNum;
}

export const tileImageName = [
    "tile-default", //0
    "tile-agent",   //1
    "tile-flame",   //2
    "tile-triangle-flag",   // 3
    "tile-square-flag",     // 4
    "tile-goal",    //5
];

export const questionMap = [
    [2, 2, 2, 2, 2, 2, 2, 2,
     2, 1, 0, 0, 0, 0, 0, 2,
     2, 0, 0, 0, 3, 0, 0, 2,
     2, 0, 0, 0, 0, 0, 0, 2,
     2, 0, 0, 4, 0, 0, 0, 2,
     2, 0, 0, 0, 0, 0, 0, 2,
     2, 0, 0, 0, 0, 0, 5, 2,
     2, 2, 2, 2, 2, 2, 2, 2,],
    
    [2, 2, 2, 2, 2, 2, 2, 2,
     2, 1, 0, 0, 0, 0, 0, 2,
     2, 0, 0, 0, 0, 0, 0, 2,
     2, 0, 0, 0, 0, 0, 0, 2,
     2, 0, 0, 0, 0, 0, 0, 2,
     2, 0, 0, 0, 0, 0, 0, 2,
     2, 0, 0, 0, 0, 0, 0, 2,
     2, 2, 2, 2, 2, 2, 2, 2,],
];