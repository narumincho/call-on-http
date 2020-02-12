/**
 * id (f4b44edab5e16b5f05786038d247ca2e)
 */
type UserId = string & { _580d8d6a54cf43e4452a0bba6694a4ed: never };

/**
 * @id f4b44edab5e16b5f05786038d247ca2e
 *
 * ユーザー
 */
type User = {
  _id: UserId;
  /**
   * @id bfb01ad37fee7368cd3f82f1536b8136
   *
   * 名前
   */
  name: string;
  /**
   * @id cffd0fe1c1421fb3e5a123a9b4e97ff4
   *
   * 年齢
   */
  age: number;
  _readTime: Date;
};

/**
 * id (4f5430da2576ddad4c7eecb3e3c98b20)
 */
type ImageId = string & {
  _4f5430da2576ddad4c7eecb3e3c98b20: never;
};

/**
 * @id 4f5430da2576ddad4c7eecb3e3c98b20
 * 画像データ
 */
type Image = {
  /**
   * @id 6969d947c406bd59c73f7537d95fd4ab
   * データ
   */
  data: Uint8Array;
};

type CallOnHttpError = "offline" | "breakingChange";
/**
 *
 * レスポンスの型のCacheTypeがcacheByIdだった場合に作られる
 *
 * @param request
 * @param cacheCallback キャッシュしていたが、鮮度が落ちていた場合に返ってくるコールバック。キャッシュされていなかった場合、このコールバックは呼ばれない
 * @param freshResponseCallback まだ、キャッシュしているデータが新鮮だった場合はキャッシュが返ってくるコールバック。キャッシュしているものが古かった場合、実際にHTTPリクエストして返ってくるものが返ってくるコールバック
 * @param errorCallback なにかエラーが起こったときに呼ばれるコールバック
 * @param option 強制的にHTTPリクエストするかどうか。{ forceHttpRequest: true }だった場合、キャッシュはすべて鮮度が落ちているものとして扱われる
 */
const getUserById = (
  request: UserId,
  cacheCallback: (user: User) => void,
  freshResponseCallback: (user: User) => void,
  errorCallback: (error: CallOnHttpError) => void,
  option: { forceHttpRequest: boolean }
): void => {
  return;
};

/**
 * レスポンスの型のCacheTypeがcacheByHashだった場合に作られる
 */
const getImageByHash = (
  request: ImageId,
  responseCallback: (image: Image) => void,
  errorCallback: (error: CallOnHttpError) => void
): void => {
  return;
};
