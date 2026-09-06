import { Pipe, PipeTransform } from '@angular/core';

/** Replaces all occurrences of `from` with `to` in a string. */
@Pipe({ name: 'replace', standalone: true, pure: true })
export class ReplacePipe implements PipeTransform {
  transform(value: string, from: string, to: string): string {
    if (!value) return value;
    return value.split(from).join(to);
  }
}
