
export interface LoginFormData {
  identifier: string; // RUC or Email
  password: string;
  rememberMe: boolean;
}

export interface FormErrors {
  identifier?: string;
  password?: string;
}

export enum LoginStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
