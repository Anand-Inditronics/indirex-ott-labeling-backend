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
@Index(["news_segment"])
@Index(["category"])
export class LabelNews {
  @PrimaryColumn()
  content_id!: number;

  @Column()
  news_segment!: string;

  @Column({ nullable: true })
  category!: string;

  @Column({ nullable: true })
  anchor!: string;

  @Column({ nullable: true })
  language!: string;

  @Column({ nullable: true })
  duration!: number;

  @OneToOne(() => LabelContent, (content) => content.news, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "content_id" })
  content!: LabelContent;
}
