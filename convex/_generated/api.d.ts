/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as deals from "../deals.js";
import type * as deposits from "../deposits.js";
import type * as domain_dealMachine from "../domain/dealMachine.js";
import type * as domain_deals from "../domain/deals.js";
import type * as domain_deposits from "../domain/deposits.js";
import type * as domain_disputes from "../domain/disputes.js";
import type * as domain_escrow from "../domain/escrow.js";
import type * as domain_fees from "../domain/fees.js";
import type * as domain_kyc from "../domain/kyc.js";
import type * as domain_ledger from "../domain/ledger.js";
import type * as domain_listings from "../domain/listings.js";
import type * as domain_withdrawals from "../domain/withdrawals.js";
import type * as escrow from "../escrow.js";
import type * as http from "../http.js";
import type * as kyc from "../kyc.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_errors from "../lib/errors.js";
import type * as lib_hmac from "../lib/hmac.js";
import type * as lib_money from "../lib/money.js";
import type * as listings from "../listings.js";
import type * as services_emailCodes from "../services/emailCodes.js";
import type * as users from "../users.js";
import type * as wallet from "../wallet.js";
import type * as withdrawals from "../withdrawals.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  deals: typeof deals;
  deposits: typeof deposits;
  "domain/dealMachine": typeof domain_dealMachine;
  "domain/deals": typeof domain_deals;
  "domain/deposits": typeof domain_deposits;
  "domain/disputes": typeof domain_disputes;
  "domain/escrow": typeof domain_escrow;
  "domain/fees": typeof domain_fees;
  "domain/kyc": typeof domain_kyc;
  "domain/ledger": typeof domain_ledger;
  "domain/listings": typeof domain_listings;
  "domain/withdrawals": typeof domain_withdrawals;
  escrow: typeof escrow;
  http: typeof http;
  kyc: typeof kyc;
  "lib/auth": typeof lib_auth;
  "lib/errors": typeof lib_errors;
  "lib/hmac": typeof lib_hmac;
  "lib/money": typeof lib_money;
  listings: typeof listings;
  "services/emailCodes": typeof services_emailCodes;
  users: typeof users;
  wallet: typeof wallet;
  withdrawals: typeof withdrawals;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
