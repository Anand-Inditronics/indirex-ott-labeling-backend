import {
  Entity,
  Column,
  PrimaryColumn,
  OneToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { LabelDisruptions } from "./labelDisruptions.entity";

@Entity()
@Index(["standby_type"])
export class LabelStandBy {
  @PrimaryColumn()
  disruptions_id!: number;

  @Column()
  standby_type!: string;

  @Column({ nullable: true })
  reason!: string;

  @Column({ nullable: true })
  description!: string;

  @OneToOne(() => LabelDisruptions, (disruptions) => disruptions.standBy, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "disruptions_id" })
  disruptions!: LabelDisruptions;
}
