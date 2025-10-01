import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  Index,
} from "typeorm";
import { Event } from "./event.entity";

@Entity()
@Index(["event_id"])
@Index(["name"])
export class EventChannel {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  event_id!: string;

  @Column()
  name!: string;

  @Column({ type: "float", nullable: true })
  score!: number;

  @ManyToOne(() => Event, (event) => event.channels, { onDelete: "CASCADE" })
  event!: Event;
}
