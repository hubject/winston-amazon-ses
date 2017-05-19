import {NPMLoggingLevel, TransportInstance} from "winston";

export const SES: SESTransportStatic;

export interface SESTransportStatic {

    new(options: SESTransportOptions): TransportInstance
}

export interface SESTransportOptions {

    to: string[];
    from: string;
    level?: NPMLoggingLevel;
    silent?: boolean;
    label?: string;
    subject?: string;

    accessKey: string;
    secretKey: string;

    waitUntilSend?: number;
    messageQueueLimit?: number;
}