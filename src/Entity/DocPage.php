<?php

namespace App\Entity;

use App\Repository\DocPageRepository;
use DateTimeImmutable;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: DocPageRepository::class)]
#[ORM\Table(name: 'doc_pages')]
#[ORM\HasLifecycleCallbacks]
class DocPage
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(name: 'id', type: Types::INTEGER)]
    private ?int $id = null;
    
    #[ORM\Column(name: 'name', type: Types::STRING, length: 255)]
    #[Assert\NotBlank]
    #[Assert\Length(max: 255)]
    private ?string $title = null;
    
    #[ORM\Column(name: 'slug', type: Types::STRING, length: 255, unique: true)]
    #[Assert\NotBlank]
    #[Assert\Length(max: 255)]
    #[Assert\Regex('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', message: 'Slug can only contain lowercase letters, numbers, and hyphens')]
    private ?string $slug = null;
    
    #[ORM\Column(name: 'content', type: Types::TEXT, nullable: true)]
    private ?string $content = null;
    
    #[ORM\Column(name: 'created_at', type: Types::DATE_IMMUTABLE, nullable: true)]
    private ?DateTimeImmutable $createdAt = null;
    
    #[ORM\Column(name: 'updated_at', type: Types::DATE_IMMUTABLE, nullable: true)]
    private ?DateTimeImmutable $updatedAt = null;
    
    #[ORM\PrePersist]
    public function setCreatedAtValue(): void
    {
        $this->createdAt = new DateTimeImmutable();
        $this->updatedAt = new DateTimeImmutable();
    }
    
    #[ORM\PreUpdate]
    public function setUpdatedAtValue(): void
    {
        $this->updatedAt = new DateTimeImmutable();
    }
    
    public function getId(): ?int
    {
        return $this->id;
    }
    
    public function setId(?int $id): void
    {
        $this->id = $id;
    }
    
    public function getTitle(): ?string
    {
        return $this->title;
    }
    
    public function setTitle(?string $title): void
    {
        $this->title = $title;
    }
    
    public function getSlug(): ?string
    {
        return $this->slug;
    }
    
    public function setSlug(?string $slug): void
    {
        $this->slug = $slug;
    }
    
    public function getContent(): ?string
    {
        return $this->content;
    }
    
    public function setContent(?string $content): void
    {
        $this->content = $content;
    }
    
    public function getCreatedAt(): ?DateTimeImmutable
    {
        return $this->createdAt;
    }
    
    public function setCreatedAt(?DateTimeImmutable $createdAt): void
    {
        $this->createdAt = $createdAt;
    }
    
    public function getUpdatedAt(): ?DateTimeImmutable
    {
        return $this->updatedAt;
    }
    
    public function setUpdatedAt(?DateTimeImmutable $updatedAt): void
    {
        $this->updatedAt = $updatedAt;
    }
    
    
    
}