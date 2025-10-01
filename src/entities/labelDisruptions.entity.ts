import {
  Entity,
  Column,
  PrimaryColumn,
  OneToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Label } from "./label.entity";
import { LabelNoVideo } from "./labelNoVideo.entity";
import { LabelStandBy } from "./labelStandBy.entity";

@Entity()
@Index(["disruption_type"])
export class LabelDisruptions {
  @PrimaryColumn()
  label_id!: number;

  @Column()
  disruption_type!: string;

  @Column({ nullable: true })
  reason!: string;

  @OneToOne(() => Label, (label) => label.disruptions, { onDelete: "CASCADE" })
  @JoinColumn({ name: "label_id" })
  label!: Label;

  @OneToOne(() => LabelNoVideo, (labelNoVideo) => labelNoVideo.disruptions, {
    cascade: true,
    nullable: true,
  })
  noVideo!: LabelNoVideo | null;

  @OneToOne(() => LabelStandBy, (labelStandBy) => labelStandBy.disruptions, {
    cascade: true,
    nullable: true,
  })
  standBy!: LabelStandBy | null;
}
