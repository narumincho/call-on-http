/** ユーザー */
export type User = {
  /** 名前 */
  name: string;
  /** 年齢 */
  age: number;
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
    age: 21
  };
};

export const getUserNoPromise = (id: string): User => {
  return {
    name: "Kish.",
    age: 21
  };
};

export const functionWithOutReturnType = (id: string) => {
  return {
    data: 32
  };
};

export function functionStyleFunction(params: string): string {
  return "ok";
}
