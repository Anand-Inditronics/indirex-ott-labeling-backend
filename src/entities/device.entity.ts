import { Entity, Column, PrimaryColumn } from "typeorm";

@Entity()
export class Device {
  @PrimaryColumn()
  device_id!: string;

  @Column({ default: true })
  is_active!: boolean;
}
