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
@Index(["movie_name"])
@Index(["genre"])
@Index(["director"])
export class LabelMovie {
  @PrimaryColumn()
  content_id!: number;

  @Column()
  movie_name!: string;

  @Column({ nullable: true })
  genre!: string;

  @Column({ nullable: true })
  director!: string;

  @Column({ nullable: true })
  release_year!: number;

  @Column({ nullable: true })
  language!: string;

  @Column({ nullable: true })
  duration!: number;

  @Column({ nullable: true })
  rating!: number;

  @OneToOne(() => LabelContent, (content) => content.movie, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "content_id" })
  content!: LabelContent;
}
