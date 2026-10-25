/* 跨模組共用的狀態（ES module 不能從外部重新指派 let，所以集中放這裡） */
export const S = {
  curDay: 0,          /* 05 章目前顯示第幾天 */
  previewIdx: null,   /* 預覽用：null = 真正的今天 */
  page: null,         /* 目前所在頁，用來判斷是不是從別頁進 05 */
  carAt: null,        /* 05 日期線的小纜車上次停在第幾天 */
  route: () => {}     /* main.js 啟動時換成真正的 route() */
};
