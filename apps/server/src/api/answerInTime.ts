/**
 * What some work answers, or what to say instead where it has not answered by the deadline or
 * fails: for an answer that must come back promptly whatever the work behind it is doing. The
 * deadline's timer never keeps the process alive on its own.
 *
 * @param work - The work being waited on.
 * @param otherwise - What to answer where it is late or fails.
 * @param withinMs - How long to wait for it.
 * @returns Its answer, or the stand-in.
 */
const answerInTime = <Answer>(
  work: Promise<Answer>,
  otherwise: Answer,
  withinMs: number,
): Promise<Answer> =>
  Promise.race([
    work.catch(() => otherwise),
    new Promise<Answer>((resolve) => {
      setTimeout(() => {
        resolve(otherwise);
      }, withinMs).unref();
    }),
  ]);

export { answerInTime };
