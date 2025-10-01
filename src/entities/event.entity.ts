import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToMany,
  Index,
} from "typeorm";
import { EventAd } from "./eventAd.entity";
import { EventChannel } from "./eventChannel.entity";
import { EventContent } from "./eventContent.entity";
import { LabelEvent } from "./labelEvent.entity";

@Entity()
@Index(["device_id"])
@Index(["timestamp"])
export class Event {
  @PrimaryGeneratedColumn("increment", { type: "bigint" })
  id!: string;

  @Column()
  device_id!: string;

  @Column({ type: "bigint" })
  timestamp!: number;

  @Column()
  type!: number;

  @Column({ nullable: true })
  image_path!: string;

  @Column({ type: "float", nullable: true })
  max_score!: number;

  @CreateDateColumn()
  created_at!: Date;

  @OneToMany(() => EventAd, (eventAd) => eventAd.event, { cascade: true })
  ads!: EventAd[];

  @OneToMany(() => EventChannel, (eventChannel) => eventChannel.event, {
    cascade: true,
  })
  channels!: EventChannel[];

  @OneToMany(() => EventContent, (eventContent) => eventContent.event, {
    cascade: true,
  })
  content!: EventContent[];

  @OneToMany(() => LabelEvent, (labelEvent) => labelEvent.event)
  labels!: LabelEvent[];
}
