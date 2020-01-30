/** ユーザー */
export type User = {
  /** 名前 */
  name: string;
  /** 年齢 */
  age: number;
};

export type Music = { name: string; artist: User };

export type NumberType = number;

/**
 * IDからユーザーの情報を取得する
 * @param id パラメータに対するコメント
 */
export async function getUser(id: string): Promise<User> {
  return {
    name: "Kish.",
    age: 21
  };
}

export function getUserNoPromise(id: string): User {
  return {
    name: "Kish.",
    age: 21
  };
}

export function functionWithOutReturnType(id: string) {
  return {
    data: 32
  };
}

export function functionStyleFunction(params: string): string {
  return "ok";
}
