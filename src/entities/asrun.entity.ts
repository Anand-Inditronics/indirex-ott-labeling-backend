import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("as_run") // Explicitly specify table name to match database
export class AsRun {
  @PrimaryGeneratedColumn() // Auto-generate ID
  id!: number;

  @Column()
  uploaded_by!: string;

  @Column({ type: "timestamp" })
  uploaded_at!: Date;

  @Column()
  channel_name!: string;

  @Column({ type: "date" })
  date!: Date;

  @Column()
  file_url!: string;
}
