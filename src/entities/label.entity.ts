import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToOne,
  OneToMany,
  Index,
} from "typeorm";
import { LabelCommercial } from "./labelCommercial.entity";
import { LabelContent } from "./labelContent.entity";
import { LabelDisruptions } from "./labelDisruptions.entity";
import { LabelEvent } from "./labelEvent.entity";

@Entity()
@Index(["label_type"])
@Index(["created_by"])
export class Label {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: "enum",
    enum: ["LabelCommercial", "LabelContent", "LabelDisruptions"],
  })
  label_type!: string;

  @Column()
  created_by!: string;

  @CreateDateColumn()
  created_at!: Date;

  @Column({ type: "bigint" })
  start_time!: string;

  @Column({ type: "bigint" })
  end_time!: string;

  @Column({ nullable: true })
  notes!: string;

  @OneToOne(() => LabelCommercial, (labelCommercial) => labelCommercial.label, {
    cascade: true,
    nullable: true,
  })
  commercial!: LabelCommercial | null;

  @OneToOne(() => LabelContent, (labelContent) => labelContent.label, {
    cascade: true,
    nullable: true,
  })
  content!: LabelContent | null;

  @OneToOne(
    () => LabelDisruptions,
    (labelDisruptions) => labelDisruptions.label,
    { cascade: true, nullable: true }
  )
  disruptions!: LabelDisruptions | null;

  @OneToMany(() => LabelEvent, (labelEvent) => labelEvent.label, {
    cascade: true,
    eager: true, // ✅ auto-load events when fetching labels
  })
  events!: LabelEvent[];
}
