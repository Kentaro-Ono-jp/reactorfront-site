/**
 * 本文の可視文字数を毎分450文字で換算し、読者へ伝わりやすい最寄りの5分単位へ丸める。
 * 参考資料一覧と別記事への導線は読了時間に含めない。
 */
export const articleReadingMinutes = {
  overview: 10,
  aws: 20,
  ml: 15,
} as const;
