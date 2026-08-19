import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Patient } from "../entities/patient.entity";
import { NotificationsService } from "./notifications.service";

@Module({
  imports: [TypeOrmModule.forFeature([Patient])],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
