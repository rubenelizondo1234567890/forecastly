<?php
// src/Entity/Page.php

namespace App\Entity;

use App\Repository\PageRepository;
use DateTime;
use DateTimeInterface;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: PageRepository::class)]
#[ORM\HasLifecycleCallbacks]
class Page
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255, unique: true)]
    #[Assert\NotBlank]
    private ?string $slug = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $title = null;

    #[ORM\Column(length: 300, nullable: true)]
    private ?string $seoDescription = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $seoKeywords = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $ogImageUrl = null;//Comma‑separated list of image URLs for Open Graph.

    #[ORM\Column(type: Types::BOOLEAN, nullable: true)]
    private ?bool $status;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    private ?DateTimeInterface $createdAt = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    private ?DateTimeInterface $updatedAt = null;

    #[ORM\ManyToOne(inversedBy: 'pages')]
    #[ORM\JoinColumn(nullable: true)] // allows pages without a journey
    private ?Journey $journey = null;

    #[ORM\PrePersist]
    public function setCreatedAtValue(): void
    {
        if ($this->createdAt === null) {
            $this->createdAt = new DateTime(); // mutable
        }
    }

    #[ORM\PreUpdate]
    public function setUpdatedAtValue(): void
    {
        $this->updatedAt = new DateTime(); // was DateTimeImmutable
    }

    // Getters and setters for all properties...
    public function getId(): ?int { return $this->id; }
    public function getSlug(): ?string { return $this->slug; }
    public function setSlug(string $slug): static { $this->slug = $slug; return $this; }
    public function getTitle(): ?string { return $this->title; }
    public function setTitle(?string $title): static { $this->title = $title; return $this; }
    public function getSeoDescription(): ?string { return $this->seoDescription; }
    public function setSeoDescription(?string $seoDescription): static { $this->seoDescription = $seoDescription; return $this; }
    public function getSeoKeywords(): ?string { return $this->seoKeywords; }
    public function setSeoKeywords(?string $seoKeywords): static { $this->seoKeywords = $seoKeywords; return $this; }
    public function getOgImageUrl(): ?string { return $this->ogImageUrl; }
    public function setOgImageUrl(?string $ogImageUrl): static { $this->ogImageUrl = $ogImageUrl; return $this; }
    public function getCreatedAt(): ?DateTimeInterface { return $this->createdAt; }
    public function getUpdatedAt(): ?DateTimeInterface { return $this->updatedAt; }

    public function getStatus(): ?bool
    {
        return $this->status;
    }

    public function setStatus(?bool $status): Page
    {
        $this->status = $status;
        return $this;
    }

    public function getJourney(): ?Journey
    {
        return $this->journey;
    }

    public function setJourney(?Journey $journey): static
    {
        $this->journey = $journey;
        return $this;
    }


    /**
     * Returns an array of image URLs from the comma‑separated list.
     * @return string|null
     */
    public function getOgImgUrl(): ?string
    {
        if (!$this->ogImageUrl) {
            return '';
        }
        $imgUrls = array_map('trim', explode(',', $this->ogImageUrl));
        $count = count($imgUrls);
        if ($count > 1) {
            $imgUrlIndex = rand(0, $count - 1);
        } else {
            $imgUrlIndex = 0;
        }

        return $imgUrls[$imgUrlIndex];
    }

    public function generateSlug(): void
    {
        if (!$this->slug && $this->title) {
            $this->slug = strtolower(preg_replace(
                '/[^A-Za-z0-9-]+/',
                '-',
                $this->title
            ));
        }
    }
}
