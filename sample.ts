export const constantValue = "stringValue";

/** ユーザー */
type User = {
  /** 名前 */
  name: string;
  /** 年齢 */
  age: number;
  /** 作成日時 */
  createdAt: Date;
};

/** IDからユーザーの情報を取得する */
export const getUser = async (id: string): Promise<User> => {
  return {
    name: "Kish.",
    age: 21,
    createdAt: new Date()
  };
};
