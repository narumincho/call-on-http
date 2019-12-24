/** 説明 */
export const constantValue: string = "stringValue";

/** ユーザー */
export type User = {
  /** 名前 */
  name: string;
  /** 年齢 */
  age: number;
  /** 作成日時 */
  createdAt: Date;
};

export type UseRef = User;

export type UnionSample = string | number | { obj: string };

/**
 * IDからユーザーの情報を取得する
 * @param id パラメータに対するコメント
 */
export const getUser = async (id: string): Promise<User> => {
  return {
    name: "Kish.",
    age: 21,
    createdAt: new Date()
  };
};

export const getUserNoPromise = (id: string): User => {
  return {
    name: "Kish.",
    age: 21,
    createdAt: new Date()
  };
};

export const functionWithOutReturnType = (id: string) => {
  return {
    data: 32
  };
};
