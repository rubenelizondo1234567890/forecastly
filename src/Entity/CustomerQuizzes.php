<?php

namespace App\Entity;

use App\Repository\CustomerQuizzesRepository;
use DateTimeInterface;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: CustomerQuizzesRepository::class)]
class CustomerQuizzes
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(type: Types::INTEGER)]
    private ?int $quizzScore = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    private ?DateTimeInterface $dateQuizzTaken = null;

    #[ORM\OneToOne(targetEntity: Page::class)]
    #[ORM\JoinColumn(name: 'page_id', referencedColumnName: 'id', nullable: false)]
    private ?Page $page = null;

    #[ORM\ManyToOne(targetEntity: Customer::class, inversedBy: 'customerQuizzes')]
    #[ORM\JoinColumn(name: 'customer_id', referencedColumnName: 'id', nullable: false)]
    private ?Customer $customer = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getQuizzScore(): ?int
    {
        return $this->quizzScore;
    }

    public function setQuizzScore(int $quizzScore): static
    {
        $this->quizzScore = $quizzScore;
        return $this;
    }

    public function getDateQuizzTaken(): ?DateTimeInterface
    {
        return $this->dateQuizzTaken;
    }

    public function setDateQuizzTaken(DateTimeInterface $dateQuizzTaken): static
    {
        $this->dateQuizzTaken = $dateQuizzTaken;
        return $this;
    }

    public function getPage(): ?Page
    {
        return $this->page;
    }

    public function setPage(?Page $page): static
    {
        $this->page = $page;
        return $this;
    }

    public function getCustomer(): ?Customer
    {
        return $this->customer;
    }

    public function setCustomer(?Customer $customer): static
    {
        $this->customer = $customer;
        return $this;
    }
}
