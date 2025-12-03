import { IsNotEmpty, IsString } from "class-validator";

export class CreationMissionsDto {
    @IsString()
    @IsNotEmpty()
    context: string;
}