import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

import ipaddr from "ipaddr.js";

import { ExtractionError } from "./errors";

export interface ResolvedAddress {
  address: string;
  family: number;
}
export type DnsLookup = (hostname: string) => Promise<ResolvedAddress[]>;
export const resolveAddresses: DnsLookup = (hostname) =>
  lookup(hostname, { all: true, verbatim: true });

export function isPublicAddress(address: string): boolean {
  try {
    const ip = ipaddr.parse(address);
    if (ip.kind() === "ipv6" && (ip as ipaddr.IPv6).isIPv4MappedAddress()) {
      return (ip as ipaddr.IPv6).toIPv4Address().range() === "unicast";
    }
    if (ip.kind() === "ipv6" && !(ip as ipaddr.IPv6).match(ipaddr.IPv6.parse("2000::"), 3))
      return false;
    return ip.range() === "unicast";
  } catch {
    return false;
  }
}

export function parsePublicUrl(input: string): URL {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new ExtractionError("INVALID_URL");
  }
  if (!["http:", "https:"].includes(url.protocol)) throw new ExtractionError("INVALID_URL");
  const host = url.hostname
    .replace(/^\[|\]$/g, "")
    .replace(/\.$/, "")
    .toLowerCase();
  if (
    url.username ||
    url.password ||
    url.port ||
    (!host.includes(".") && !isIP(host)) ||
    /(^|\.)(localhost|local|internal|home|lan|test|invalid)$/.test(host) ||
    host === "metadata.google.internal" ||
    (isIP(host) && !isPublicAddress(host))
  ) {
    throw new ExtractionError("UNSAFE_URL");
  }
  url.hash = "";
  return url;
}

export async function validateUrl(
  input: string,
  signal: AbortSignal,
  resolver: DnsLookup = resolveAddresses,
) {
  const url = parsePublicUrl(input);
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  signal.throwIfAborted();
  const addresses = isIP(hostname)
    ? [{ address: hostname, family: isIP(hostname) }]
    : await new Promise<ResolvedAddress[]>((resolve, reject) => {
        const abort = () => reject(signal.reason);
        signal.addEventListener("abort", abort, { once: true });
        resolver(hostname)
          .then(resolve, reject)
          .finally(() => signal.removeEventListener("abort", abort));
      });
  signal.throwIfAborted();
  if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address))) {
    throw new ExtractionError("UNSAFE_URL");
  }
  return { url, addresses };
}
