import {
  Entity,
  Column,
  PrimaryColumn,
  OneToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { LabelCommercial } from "./labelCommercial.entity";
import { PromoType } from "./enums";

@Entity()
@Index(["program_name"])
@Index(["movie_name"])
export class LabelPromo {
  @PrimaryColumn()
  commercial_id!: number;

  @Column({ nullable: true })
  program_name!: string;

  @Column({ nullable: true })
  movie_name!: string;

  @Column({ nullable: true })
  event_name!: string;

  @OneToOne(() => LabelCommercial, (commercial) => commercial.promo, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "commercial_id" })
  commercial!: LabelCommercial;
}
