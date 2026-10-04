import { styled } from "@linaria/react";

export const Screen = styled.main`
  flex: 1;
  min-height: 0;
  width: min(1040px, 100%);
  margin: auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 28px 0;
  overflow: auto;
`;

export const Intro = styled.div`
  margin-bottom: 32px;
  text-align: center;

  h1 {
    margin: 8px 0;
    font-size: clamp(30px, 4vw, 50px);
    letter-spacing: -1.8px;
  }

  p {
    margin: 0;
    font-size: 16px;
  }
`;

export const Eyebrow = styled.div`
  color: var(--color-accent, #8db9ff);
`;

export const Cards = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`;

export const Card = styled.button`
  display: flex;
  min-height: 220px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  padding: 32px;
  border: 1px solid var(--color-border, #35455c);
  border-radius: 14px;
  background: var(--color-surface, #141e2b);
  box-shadow: 0 20px 70px color-mix(in srgb, var(--color-text) 13%, transparent);
  cursor: pointer;
  text-align: center;

  &:hover:not(:disabled) {
    border-color: var(--color-focus, #78a9ed);
    background: var(--color-surface-hover, #1b2a3c);
  }

  strong {
    display: block;
    font-size: 24px;
    letter-spacing: -0.6px;
  }
`;

export const TournamentCard = styled(Card)`
  background: linear-gradient(
    135deg,
    var(--color-surface, #1c2740),
    var(--color-surface-raised, #182536)
  );
`;

export const Icon = styled.span`
  display: grid;
  width: 120px;
  height: 120px;
  place-items: center;
  color: #dbeaff;

  img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
  }
`;
