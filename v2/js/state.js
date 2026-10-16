/* 跨模組共用的狀態（ES module 不能從外部重新指派 let，所以集中放這裡） */
export const S = {
  curDay: 0,          /* 05 章目前顯示第幾天 */
  previewIdx: null,   /* 預覽用：null = 真正的今天 */
  dayPicked: false,
  route: () => {}     /* main.js 啟動時換成真正的 route() */
};
