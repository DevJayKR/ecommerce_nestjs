import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  public id?: string;

  // email, password, username
  @Column({ unique: true })
  public email: string;

  @Column()
  public username?: string;

  @Column({ nullable: false })
  public password: string;

  @Column({ default: 0 })
  public gender: number;
}
