import {
  Entity,
  Column,
  PrimaryColumn,
  OneToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { LabelCommercial } from "./labelCommercial.entity";
import { AdType } from "./enums";

@Entity()
@Index(["brand"])
export class LabelSpotOutsideBreak {
  @PrimaryColumn()
  commercial_id!: number;

  @Column({ nullable: true })
  brand!: string;

  @Column({ nullable: true })
  product!: string;

  @Column({ nullable: true })
  category!: string;

  @Column({ nullable: true })
  title!: string;

  @Column({ nullable: true })
  language!: string;

  @Column()
  sector!: string;
  
  @Column()
  format!: string;

  @OneToOne(
    () => LabelCommercial,
    (commercial) => commercial.spotOutsideBreak,
    { onDelete: "CASCADE" }
  )
  @JoinColumn({ name: "commercial_id" })
  commercial!: LabelCommercial;
}
