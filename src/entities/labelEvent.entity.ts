import { Entity, ManyToOne, JoinColumn, PrimaryColumn } from "typeorm";
import { Event } from "./event.entity";
import { Label } from "./label.entity";

@Entity()
export class LabelEvent {
  @PrimaryColumn()
  label_id!: number;

  @PrimaryColumn({ type: "bigint" })
  event_id!: string;

  @ManyToOne(() => Label, (label) => label.events, { onDelete: "CASCADE" })
  @JoinColumn({ name: "label_id" }) // ✅ link relation to existing column
  label!: Label;

  @ManyToOne(() => Event, (event) => event.labels, { onDelete: "CASCADE" })
  @JoinColumn({ name: "event_id" }) // ✅ link relation to existing column
  event!: Event;
}
