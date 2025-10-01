import {
  Entity,
  Column,
  PrimaryColumn,
  OneToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { LabelContent } from "./labelContent.entity";

@Entity()
@Index(["program_title"])
@Index(["sport_type"])
@Index(["program_category"])
export class LabelSports {
  @PrimaryColumn()
  content_id!: number;

  @Column()
  program_title!: string;

  @Column()
  sport_type!: string;

  @Column()
  program_category!: string;

  @Column({ nullable: true })
  language!: string;

  @Column()
  live!: boolean;

  @OneToOne(() => LabelContent, (content) => content.sports, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "content_id" })
  content!: LabelContent;
}
