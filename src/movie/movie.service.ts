import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Movie } from './entities/movie.entity';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MovieService {
  constructor(
    @InjectRepository(Movie)
    private movieRepository: Repository<Movie>,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  async getMovies() {
    const { data, status } = await this.httpService
      .get(this.configService.get('MOVIE_ADDRESS'))
      .toPromise();

    const movies = [];

    if (status === 200) {
      const movieData = data.results;

      movieData.map((movie) =>
        movies.push({
          title: movie.title,
          description: movie.overview,
          poster_path: movie.poster_path,
          release_data: movie.release_date,
        }),
      );
    }

    return await this.movieRepository.save(movies);
  }
}
