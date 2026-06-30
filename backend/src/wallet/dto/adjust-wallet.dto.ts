import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class AdjustWalletDto {
  @IsNumber() amount: number;
  @IsString() @IsNotEmpty() note: string;
  @IsOptional() @IsIn(['vietqr', 'manual']) source?: 'vietqr' | 'manual';
}
