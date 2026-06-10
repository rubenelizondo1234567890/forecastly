<?php

namespace App\Entity;

use DateTimeInterface;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'customer_forecasts')]
class CustomerForecasts
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(name: 'id', type: Types::INTEGER)]
    private int $id;
    
    #[ORM\Column(name: 'created_at', type: Types::DATETIME_MUTABLE, nullable: false)]
    private DateTimeInterface $createdAt;
    
    #[ORM\Column(name: 'updated_at', type: Types::DATETIME_MUTABLE, nullable: false)]
    private DateTimeInterface $updatedAt;
    
    /** Json encoded string with the same structure as AccountsTrackingCalendar entries */
    #[ORM\Column(name: 'data', type: Types::TEXT, nullable: false)]
    private string $data;
    
    #[ORM\ManyToOne(targetEntity: CustomersAccount::class)]
    #[ORM\JoinColumn(name: 'customers_account_id', referencedColumnName: 'id', nullable: false)]
    private CustomersAccount $customersAccount;
    
    public function getId(): int
    {
        return $this->id;
    }
    
    public function getCreatedAt(): DateTimeInterface
    {
        return $this->createdAt;
    }
    
    /**
     * @param DateTimeInterface $createdAt
     * @return CustomerForecasts
     */
    public function setCreatedAt(DateTimeInterface $createdAt): CustomerForecasts
    {
        $this->createdAt = $createdAt;
        return $this;
    }
    
    public function getUpdatedAt(): DateTimeInterface
    {
        return $this->updatedAt;
    }
    
    /**
     * @param DateTimeInterface $updatedAt
     * @return CustomerForecasts
     */
    public function setUpdatedAt(DateTimeInterface $updatedAt): CustomerForecasts
    {
        $this->updatedAt = $updatedAt;
        return $this;
    }
    
    public function getData(): array
    {
        return json_decode($this->data, true) ?? [];
    }
    
    /**
     * @param array $data
     * @return CustomerForecasts
     */
    public function setData(array $data): CustomerForecasts
    {
        $this->data = json_encode($data);
        return $this;
    }
    
    public function getCustomersAccount(): CustomersAccount
    {
        return $this->customersAccount;
    }
    
    /**
     * @param CustomersAccount $customersAccount
     * @return CustomerForecasts
     */
    public function setCustomersAccount(CustomersAccount $customersAccount): CustomerForecasts
    {
        $this->customersAccount = $customersAccount;
        return $this;
    }
}