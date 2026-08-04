import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';

export class PushKeysDto {
  @IsString()
  p256dh: string;

  @IsString()
  auth: string;
}

/** Entspricht dem, was `PushSubscription.toJSON()` im Browser liefert. */
export class CreatePushSubscriptionDto {
  /**
   * Vom Push-Dienst des Browsers vergebene Adresse. Als URL validiert, damit
   * kein beliebiger String in der Tabelle landet.
   */
  // Push-Endpunkte sind immer absolute https-URLs. Vorher stand hier
  // `require_tld: false`, womit validator.js einen blossen Namen wie "kein-url"
  // als gueltigen Host akzeptiert und der Endpunkt so in der Tabelle landet.
  @IsUrl({ protocols: ['https'], require_protocol: true })
  endpoint: string;

  @ValidateNested()
  @Type(() => PushKeysDto)
  keys: PushKeysDto;
}

export class DeletePushSubscriptionDto {
  // Push-Endpunkte sind immer absolute https-URLs. Vorher stand hier
  // `require_tld: false`, womit validator.js einen blossen Namen wie "kein-url"
  // als gueltigen Host akzeptiert und der Endpunkt so in der Tabelle landet.
  @IsUrl({ protocols: ['https'], require_protocol: true })
  endpoint: string;
}

export class UpdatePreferencesDto {
  @IsOptional()
  @IsBoolean()
  proposalReceived?: boolean;

  @IsOptional()
  @IsBoolean()
  tableFree?: boolean;
}
