"use client";

import { useActionState } from "react";

import {
  createExampleRecordAction,
  type ICreateExampleRecordActionResult,
} from "../actions/create-example-record.action";

const initialResult: ICreateExampleRecordActionResult = { isSuccess: false, message: "" };

export interface IUseExampleFormViewModelReturn {
  result: ICreateExampleRecordActionResult;
  formAction: (payload: FormData) => void;
  isPending: boolean;
}

export function useExampleFormViewModel(): IUseExampleFormViewModelReturn {
  const [result, formAction, isPending] = useActionState(createExampleRecordAction, initialResult);

  return {
    result,
    formAction,
    isPending,
  };
}
