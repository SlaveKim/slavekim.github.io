import { getUser } from "/js/lib/ls/users/index.js";

const LOGIN_PATH = "/pages/login/";
const LOGGEDIN_PATH = "/pages/todo/"

export const authGuard = () => {
  const user = getUser();
  if (!user) location.href = LOGIN_PATH;
};

export const loginGuard = () => {
  const user = getUser();
  if (user) location.href = LOGGEDIN_PATH
}