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
@Index(["disruption_type"])
export class LabelNoVideo {
  @PrimaryColumn()
  disruptions_id!: number;

  @Column()
  disruption_type!: string;

  @Column({ nullable: true })
  reason!: string;

  @Column({ nullable: true })
  description!: string;

  @OneToOne(() => LabelDisruptions, (disruptions) => disruptions.noVideo, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "disruptions_id" })
  disruptions!: LabelDisruptions;
}
